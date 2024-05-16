/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { onBeforeUnmount, ref } from 'vue';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';

/**
 * Provides reactive TODO,
 * as well as a function to observe and update the component's clock,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {OpenMCT} [openmct] the Open MCT API
 * @param {TimeContext} [timeContext] the time context to use for time API clock events
 * @returns {{
 *   observeClock: () => void,
 *   timeMode: import('vue').Ref<string>,
 *   isFixedTimeMode: import('vue').Ref<boolean>,
 *   isRealTimeMode: import('vue').Ref<boolean>
 * }}
 */
export function useClock(openmct, timeContext = openmct.time) {
  let stopObservingClock;

  const clock = ref(timeContext.getClock());

  onBeforeUnmount(() => stopObservingClock?.());

  function observeClock() {
    timeContext.on(TIME_CONTEXT_EVENTS.clockChanged, updateClock);
    stopObservingClock = () => timeContext.off(TIME_CONTEXT_EVENTS.clockChanged, updateClock);
  }

  function getAllClockMetadata(menuOptions) {
    const clocks = menuOptions
      ? menuOptions
          .map((menuOption) => menuOption.clock)
          .filter((key, index, array) => key !== undefined && array.indexOf(key) === index)
          .map((clockKey) => timeContext.getAllClocks().find((_clock) => _clock.key === clockKey))
      : timeContext.getAllClocks();

    const clockMetadata = clocks.map(getClockMetadata);

    return clockMetadata;
  }

  function getClockMetadata(_clock) {
    if (_clock === undefined) {
      return;
    }

    const clockMetadata = {
      key: _clock.key,
      name: _clock.name,
      description: 'Uses the system clock as the current time basis. ' + _clock.description,
      cssClass: _clock.cssClass || 'icon-clock',
      onItemClicked: () => setClock(_clock.key)
    };

    return clockMetadata;
  }

  function setClock(key) {
    timeContext.setClock(key);
  }

  function updateClock(_clock) {
    clock.value = _clock;
  }

  /**
   * TODO: bring this back. we lost this in the last refactor.
   * changing clock requires a timesystem check.
   * 
  function setClockWithOptions() {
    const option = {
      clockKey
    };
    let configuration = this.getMatchingConfig({
      clock: clockKey,
      timeSystem: this.openmct.time.getTimeSystem().key
    });

    if (configuration === undefined) {
      configuration = this.getMatchingConfig({
        clock: clockKey
      });

      option.timeSystem = configuration.timeSystem;
      option.bounds = configuration.bounds;

      // this.openmct.time.setTimeSystem(configuration.timeSystem, configuration.bounds);
    }

    const offsets = this.openmct.time.getClockOffsets() ?? configuration.clockOffsets;
    option.offsets = offsets;
  }

  function getMatchingConfig(options) {
    const matchers = {
      clock(config) {
        return options.clock === config.clock;
      },
      timeSystem(config) {
        return options.timeSystem === config.timeSystem;
      }
    };

    function configMatches(config) {
      return Object.keys(options).reduce((match, option) => {
        return match && matchers[option](config);
      }, true);
    }

    return this.configuration.menuOptions.filter(configMatches)[0];
  }
  */

  return {
    observeClock,
    clock,
    getAllClockMetadata,
    getClockMetadata
  };
}
