import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class World
{
    constructor()
    {
        this.game = new Game()

        this.scene = new THREE.Scene()

        // this.dummy = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshNormalMaterial()
        // )
        // this.scene.add(this.dummy)

        const axesHelper = new THREE.AxesHelper()
        this.scene.add(axesHelper)

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 999)
    }

    update()
    {
    }
}