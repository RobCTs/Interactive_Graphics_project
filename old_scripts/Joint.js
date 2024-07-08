<script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js"></script>

// npm install gl-matrix
import { mat4 } from 'gl-matrix';

// Class to represent a joint in a skeleton
class Joint {
    constructor(index, name, bindLocalTransform) {
        this.index = index; // unique ID of the joint
        this.name = name; // name of the joint
        this.children = []; // list to hold child joints

        // Matrix to store the animated transform of the joint
        this.animatedTransform = mat4.create();
        // Matrix to store the local bind transform of the joint
        this.localBindTransform = bindLocalTransform;
        // Matrix to store the inverse of the bind transform
        this.inverseBindTransform = mat4.create();
    }

    // Method to add a child joint to this joint
    addChild(child) {
        this.children.push(child);
    }

    // Method to get the animated transform matrix of the joint
    getAnimatedTransform() {
        return this.animatedTransform;
    }

    // Method to set the animated transform matrix of the joint
    setAnimationTransform(animationTransform) {
        //this.animatedTransform = animationTransform;
        mat4.copy(this.animatedTransform, animationTransform);
    }

    // Method to get the inverse bind transform matrix of the joint
    getInverseBindTransform() {
        return this.inverseBindTransform;
    }

    // Method to calculate the inverse bind transform for the joint and its children
    calcInverseBindTransform(parentBindTransform) {
        let bindTransform = mat4.create();
        // Calculate the model-space bind transform of this joint
        mat4.multiply(bindTransform, parentBindTransform, this.localBindTransform);
        // Calculate and store the inverse of the model-space bind transform
        mat4.invert(this.inverseBindTransform, bindTransform);
        if (!mat4.invert(this.inverseBindTransform, bindTransform)) {
            console.error('Failed to invert matrix for joint:', this.name);
        }
        
        // Recursively calculate the inverse bind transform for all child joints
        for (let child of this.children) {
            child.calcInverseBindTransform(bindTransform);
        }
    }
}
// Class of the skeleton
// // Define the bindLocalTransform as needed (identity matrices for now)
// const identityMatrix = mat4.create(); // identity matrix represents no transformation

// // Create joints with their bindLocalTransforms
// const hip = new Joint(0, 'Hip', identityMatrix);
// const upperLLeg = new Joint(1, 'Upper L Leg', identityMatrix);
// const lowerLLeg = new Joint(2, 'Lower L Leg', identityMatrix);
// const lFoot = new Joint(3, 'L Foot', identityMatrix);
// const upperRLeg = new Joint(4, 'Upper R Leg', identityMatrix);
// const lowerRLeg = new Joint(5, 'Lower R Leg', identityMatrix);
// const rFoot = new Joint(6, 'R Foot', identityMatrix);
// const chest = new Joint(7, 'Chest', identityMatrix);
// const upperLArm = new Joint(8, 'Upper L Arm', identityMatrix);
// const lowerLArm = new Joint(9, 'Lower L Arm', identityMatrix);
// const lHand = new Joint(10, 'L Hand', identityMatrix);
// const upperRArm = new Joint(11, 'Upper R Arm', identityMatrix);
// const lowerRArm = new Joint(12, 'Lower R Arm', identityMatrix);
// const rHand = new Joint(13, 'R Hand', identityMatrix);
// const neck = new Joint(14, 'Neck', identityMatrix);
// const head = new Joint(15, 'Head', identityMatrix);

// // Set up the hierarchy by adding child joints to their respective parents
// hip.addChild(upperLLeg);
// upperLLeg.addChild(lowerLLeg);
// lowerLLeg.addChild(lFoot);

// hip.addChild(upperRLeg);
// upperRLeg.addChild(lowerRLeg);
// lowerRLeg.addChild(rFoot);

// hip.addChild(chest);
// chest.addChild(upperLArm);
// upperLArm.addChild(lowerLArm);
// lowerLArm.addChild(lHand);

// chest.addChild(upperRArm);
// upperRArm.addChild(lowerRArm);
// lowerRArm.addChild(rHand);

// chest.addChild(neck);
// neck.addChild(head);

// // Initialize the hierarchy's inverse bind transforms
// // starting with the root joint (hip), that has no parent.
// hip.calcInverseBindTransform(mat4.create()); // identity matrix for the root

// // Print the inverse bind transforms to verify
// console.log("Hip Joint Inverse Bind Transform:", hip.getInverseBindTransform());
