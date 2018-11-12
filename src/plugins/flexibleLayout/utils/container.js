import Frame from './frame';

class Container {
    constructor (width) {
        this.frames = [];
        this.width = width;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;
