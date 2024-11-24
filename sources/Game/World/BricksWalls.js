import * as THREE from 'three'
import { Game } from '../Game.js'

export class BricksWalls
{
    constructor()
    {
        this.game = new Game()

        this.geometry = this.game.resources.bricksWalls.scene.children[0].geometry
        this.bricks = [...this.game.resources.bricksWalls.scene.children]
        this.count = this.bricks.length

        this.mesh = new THREE.InstancedMesh(this.geometry, this.game.materials.list.get('pureWhite'), this.count)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)

        this.visualReferences = []
        for(const _brick of this.bricks)
        {
            const visualReference = new THREE.Object3D()
            this.visualReferences.push(visualReference)

            this.game.entities.add(
                {
                    type: 'dynamic',
                    position: _brick.position,
                    rotation: _brick.quaternion,
                    friction: 0.7,
                    sleeping: true,
                    colliders: [ { shape: 'cuboid', parameters: [ 0.75 * 0.75, 0.5 * 0.75, 1 * 0.75 ], mass: 0.1 } ]
                },
                visualReference
            )
        }

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 11)
    }

    update()
    {
        let i = 0
        for(const _visualReference of this.visualReferences)
        {
            _visualReference.updateMatrixWorld()

            this.mesh.setMatrixAt(i, _visualReference.matrixWorld)
            i++
        }

        this.mesh.instanceMatrix.needsUpdate = true
    }
}