class AnimatedModel {
    // A new entity that can use animation.
    constructor(model, texture, rootJoint, jointCount) {
        this.model = model; // VAO containing the mesh data
        this.texture = texture; // diffuse texture for the entity
        this.rootJoint = rootJoint; // root joint
        this.jointCount = jointCount; // number of joints

        this.animator = new Animator(this); // instance for this entity

        // Calculate the inverse bind transform for the root joint and its descendants
        // the original (no pose applied)
        rootJoint.calcInverseBindTransform(mat4.create()); // identity matrix as the parent bind transform for the root
    }

    getModel() {
        return this.model;
    }

    getTexture() {
        return this.texture;
    }

    getRootJoint() {
        return this.rootJoint;
    }

    delete() {
        try {
            this.model.delete();
            this.texture.delete();
        } catch (error) {
            //Debug Log
            console.error('Failed to delete resources:', error);
        }
    }

    doAnimation(animation) {
        this.animator.doAnimation(animation);
    }

    // Called every frame.
    update() {
        this.animator.update();
    }

    getJointTransforms() {
        let jointMatrices = new Array(this.jointCount);
        this.addJointsToArray(this.rootJoint, jointMatrices);
        return jointMatrices; //array of model-space transforms of joints in the current animation pose.
    }

    addJointsToArray(headJoint, jointMatrices) {
        jointMatrices[headJoint.index] = headJoint.getAnimatedTransform();
        for (let childJoint of headJoint.children) {
            this.addJointsToArray(childJoint, jointMatrices);
        }
    }
}
