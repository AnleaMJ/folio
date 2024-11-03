import * as THREE from 'three'
import { Game } from '../Game.js'

import { Terrain } from './Terrain.js'
import { Bush } from './Bush.js'
import { GridFloor } from './GridFloor.js'

export class World
{
    constructor()
    {
        this.game = new Game()

        this.bush = new Bush()
        this.gridFloor = new GridFloor()
        // this.setTestCube()

        const axesHelper = new THREE.AxesHelper()
        axesHelper.position.y = 2
        this.game.scene.add(axesHelper)

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 4)
    }

    setTestCube()
    {
        const visualCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshNormalNodeMaterial()
        )
        this.game.scene.add(visualCube)

        this.game.physics.addEntity(
            {
                type: 'dynamic',
                position: { x: 0, y: 4, z: 0 },
                colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ] } ]
            },
            visualCube
        )
    }

    update()
    {
    }
}