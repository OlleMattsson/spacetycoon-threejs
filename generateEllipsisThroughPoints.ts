    drawTransferOrbit2(targetPlanet) {
        const points = this.generateEllipsePoints(this.planetMesh.position, targetPlanet.planetMesh.position, 10, 360)

        for (let i = 0; i < 360; i++) {
            const position = points[i]
            this.transferPositions[i * 3] = position.x;       
            this.transferPositions[i * 3 + 1] = position.y;
            this.transferPositions[i * 3 + 2] = position.z;
            this.transferGeometry.attributes.position.needsUpdate = true;       
        }
    }
    
    generateEllipsePoints(pointA, pointB, semiMinorAxis, numPoints = 100) {
        const positions = [];
        const center = new THREE.Vector3().lerpVectors(pointA, pointB, 0.5);
        const majorAxisVector = new THREE.Vector3().subVectors(pointB, pointA);
        const majorAxisLength = majorAxisVector.length();
        const semiMajorAxis = majorAxisLength / 2;
    
        // Create a quaternion for rotation
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), majorAxisVector.normalize());
    
        // Generate points around an ellipse centered at the origin in the XZ plane
        for (let i = 0; i < numPoints; i++) {
            const theta = (i / numPoints) * Math.PI * 2;
            const x = semiMajorAxis * Math.cos(theta); // Use semiMajorAxis for X
            const z = semiMinorAxis * Math.sin(theta); // Use semiMinorAxis for Z, given XZ as the ground
            const y = 0; // Initially in the XZ plane, Y is up
    
            let position = new THREE.Vector3(x, y, z);
            position.applyQuaternion(quaternion); // Apply the calculated rotation
            position.add(center); // Translate the position to the center of the ellipse
    
            positions.push(position);
        }
    
        return positions;
    }