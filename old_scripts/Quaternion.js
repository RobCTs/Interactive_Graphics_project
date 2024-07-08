// Define the Quaternion class to represent a 3D rotation
class Quaternion {
    // Creates a quaternion and normalizes it.
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.normalize();
    }

    // Normalization
    normalize() {
        let mag = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        this.w /= mag;
        this.x /= mag;
        this.y /= mag;
        this.z /= mag;
    }

    // Converts the quaternion to a 4x4 (exact same rotation)
    toRotationMatrix() {
        let matrix = mat4.create();
        let xy = this.x * this.y;
        let xz = this.x * this.z;
        let xw = this.x * this.w;
        let yz = this.y * this.z;
        let yw = this.y * this.w;
        let zw = this.z * this.w;
        let xSquared = this.x * this.x;
        let ySquared = this.y * this.y;
        let zSquared = this.z * this.z;

        matrix[0] = 1 - 2 * (ySquared + zSquared);
        matrix[1] = 2 * (xy - zw);
        matrix[2] = 2 * (xz + yw);
        matrix[3] = 0;

        matrix[4] = 2 * (xy + zw);
        matrix[5] = 1 - 2 * (xSquared + zSquared);
        matrix[6] = 2 * (yz - xw);
        matrix[7] = 0;

        matrix[8] = 2 * (xz - yw);
        matrix[9] = 2 * (yz + xw);
        matrix[10] = 1 - 2 * (xSquared + ySquared);
        matrix[11] = 0;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 1;

        return matrix;
    }

    // Extracts the rotation part of a transformation matrix and converts it to a quaternion.
    static fromMatrix(matrix) {
        let w, x, y, z;
        let diagonal = matrix[0] + matrix[5] + matrix[10];
        if (diagonal > 0) {
            let w4 = Math.sqrt(diagonal + 1.0) * 2.0;
            w = w4 / 4.0;
            x = (matrix[9] - matrix[6]) / w4;
            y = (matrix[2] - matrix[8]) / w4;
            z = (matrix[4] - matrix[1]) / w4;
        } else if ((matrix[0] > matrix[5]) && (matrix[0] > matrix[10])) {
            let x4 = Math.sqrt(1.0 + matrix[0] - matrix[5] - matrix[10]) * 2.0;
            w = (matrix[9] - matrix[6]) / x4;
            x = x4 / 4.0;
            y = (matrix[1] + matrix[4]) / x4;
            z = (matrix[2] + matrix[8]) / x4;
        } else if (matrix[5] > matrix[10]) {
            let y4 = Math.sqrt(1.0 + matrix[5] - matrix[0] - matrix[10]) * 2.0;
            w = (matrix[2] - matrix[8]) / y4;
            x = (matrix[1] + matrix[4]) / y4;
            y = y4 / 4.0;
            z = (matrix[6] + matrix[9]) / y4;
        } else {
            let z4 = Math.sqrt(1.0 + matrix[10] - matrix[0] - matrix[5]) * 2.0;
            w = (matrix[4] - matrix[1]) / z4;
            x = (matrix[2] + matrix[8]) / z4;
            y = (matrix[6] + matrix[9]) / z4;
            z = z4 / 4.0;
        }
        return new Quaternion(x, y, z, w);
    }

    // Interpolates between two quaternion rotations and returns the resulting quaternion rotation.
    static interpolate(a, b, blend) {
        let result = new Quaternion(0, 0, 0, 1);
        let dot = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;
        let blendI = 1.0 - blend; // inverse blend factor (between 1 and 0) indicating how far to interpolate between the two

        if (dot < 0) {
            result.w = blendI * a.w + blend * -b.w;
            result.x = blendI * a.x + blend * -b.x;
            result.y = blendI * a.y + blend * -b.y;
            result.z = blendI * a.z + blend * -b.z;
        } else {
            result.w = blendI * a.w + blend * b.w;
            result.x = blendI * a.x + blend * b.x;
            result.y = blendI * a.y + blend * b.y;
            result.z = blendI * a.z + blend * b.z;
        }

        result.normalize();
        return result;
    }
}

// Debug Usage:

// // Create two quaternions
// let quatA = new Quaternion(0, 0, 0, 1);
// let quatB = new Quaternion(1, 1, 1, 0);

// // Normalize the quaternions
// quatA.normalize();
// quatB.normalize();

// // Interpolate between the two quaternions with a blend factor of 0.5
// let interpolatedQuat = Quaternion.interpolate(quatA, quatB, 0.5);

// // Convert the interpolated quaternion to a rotation matrix
// let rotationMatrix = interpolatedQuat.toRotationMatrix();

// // Print the results
// console.log("Interpolated Quaternion:", interpolatedQuat);
// console.log("Rotation Matrix from Quaternion:", rotationMatrix);