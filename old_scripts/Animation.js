class Animator {
    constructor(entity) {
        this.entity = entity; // entity to be animated
        this.currentAnimation = null; // current animation being played
        this.animationTime = 0; // current time of the animation
    }

    doAnimation(animation) {
        this.animationTime = 0;
        this.currentAnimation = animation;
    }

    update() {
        if (this.currentAnimation == null) {
            return;
        }
        this.increaseAnimationTime();
        const currentPose = this.calculateCurrentAnimationPose();
        this.applyPoseToJoints(currentPose, this.entity.getRootJoint(), mat4.create());
    }

    increaseAnimationTime() {
        this.animationTime += DisplayManager.getFrameTime();
        if (this.animationTime > this.currentAnimation.getLength()) {
            this.animationTime %= this.currentAnimation.getLength();
        }
    }

    calculateCurrentAnimationPose() {
        const frames = this.getPreviousAndNextFrames();
        const progression = this.calculateProgression(frames[0], frames[1]);
        return this.interpolatePoses(frames[0], frames[1], progression);
    }

    applyPoseToJoints(currentPose, joint, parentTransform) {
        const currentLocalTransform = currentPose.get(joint.name);
        const currentTransform = mat4.create();
        mat4.multiply(currentTransform, parentTransform, currentLocalTransform);
        for (const childJoint of joint.children) {
            this.applyPoseToJoints(currentPose, childJoint, currentTransform);
        }
        mat4.multiply(currentTransform, currentTransform, joint.getInverseBindTransform());
        joint.setAnimationTransform(currentTransform);
    }

    getPreviousAndNextFrames() {
        const allFrames = this.currentAnimation.getKeyFrames();
        let previousFrame = allFrames[0];
        let nextFrame = allFrames[0];
        for (let i = 1; i < allFrames.length; i++) {
            nextFrame = allFrames[i];
            if (nextFrame.getTimeStamp() > this.animationTime) {
                break;
            }
            previousFrame = allFrames[i];
        }
        return [previousFrame, nextFrame];
    }

    // Calculates how far between the previous and next keyframe the current animation time is.
    calculateProgression(previousFrame, nextFrame) {
        const totalTime = nextFrame.getTimeStamp() - previousFrame.getTimeStamp();
        const currentTime = this.animationTime - previousFrame.getTimeStamp();
        return currentTime / totalTime;
    }

    // Interpolates between the poses of the previous and next keyframes to get the current pose.
    interpolatePoses(previousFrame, nextFrame, progression) {
        const currentPose = new Map();
        for (const jointName of previousFrame.getJointKeyFrames().keys()) {
            const previousTransform = previousFrame.getJointKeyFrames().get(jointName);
            const nextTransform = nextFrame.getJointKeyFrames().get(jointName);
            const currentTransform = JointTransform.interpolate(previousTransform, nextTransform, progression);
            currentPose.set(jointName, currentTransform.getLocalTransform());
        }
        return currentPose;
    }
}

// Animation class for AnimatedModel
class Animation {
    constructor(lengthInSeconds, frames) {
        this.length = lengthInSeconds; // total length of the animation in s
        this.keyFrames = frames; // keyframes for the animation
    }

    getLength() {
        return this.length; //in seconds
    }

    getKeyFrames() {
        return this.keyFrames;
    }
}