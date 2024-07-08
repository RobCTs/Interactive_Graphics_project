class JointTransform {
    //Constructor to initialize the joint transform with position and rotation.
    constructor(position, rotation) {
        this.position = position; // position relative to the parent
        this.rotation = rotation; // rotation relative to the parent
    }

    // Constructs the bone-space transform matrix by translating an identity matrix using the position variable and then applying the rotation.
    getLocalTransform() {
        let matrix = mat4.create();
        // Apply translation
        mat4.translate(matrix, matrix, this.position);
        // Convert quaternion to rotation matrix and apply rotation
        let rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, this.rotation);
        mat4.multiply(matrix, matrix, rotationMatrix);
        return matrix;
    }

    //Interpolates between two transforms based on the progression value.
    static interpolate(frameA, frameB, progression) {
        // Interpolate position linearly
        let pos = JointTransform.interpolateVectors(frameA.position, frameB.position, progression);
        // Interpolate rotation using SLERP
        let rot = quat.slerp(quat.create(), frameA.rotation, frameB.rotation, progression);
        return new JointTransform(pos, rot);
    }

    // Linearly interpolates between two vectors based on a progression value.
    static interpolateVectors(start, end, progression) {
        let result = vec3.create();
        vec3.lerp(result, start, end, progression);
        return result;
    }
}

// Define the KeyFrame class to represent one keyframe of an animation
class KeyFrame {
    //Constructor to initialize the keyframe with a timestamp and joint transforms.
    constructor(timeStamp, jointKeyFrames) {
        this.timeStamp = timeStamp; // iime (in seconds)
        this.pose = jointKeyFrames; // map ofor the pose at a keyframe
    }

    // Gets the time in seconds of the keyframe in the animation.
    getTimeStamp() {
        return this.timeStamp;
    }

    // Gets the desired bone-space transforms of all the joints at this keyframe, indexed by the name of the joint.
    getJointKeyFrames() {
        return this.pose;
    }
}
