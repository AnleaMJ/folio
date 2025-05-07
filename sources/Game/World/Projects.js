import * as THREE from 'three/webgpu'
import { Fn, normalWorld, texture } from 'three/tsl'
import { Game } from '../Game.js'

export class Projects
{
    constructor(carpet)
    {
        this.game = Game.getInstance()
        this.carpet = carpet

        this.setCarpet()
    }

    setCarpet()
    {
        const material = new THREE.MeshBasicNodeMaterial()

        // Shadow receive
        const totalShadows = this.game.lighting.addTotalShadowToMaterial(material)

        material.outputNode = Fn(() =>
        {
            const baseColor = texture(this.game.resources.projectsCarpetTexture)

            return this.game.lighting.lightOutputNodeBuilder(baseColor, normalWorld, totalShadows, true, false)
        })()

        this.carpet.receiveShadow = true
        this.carpet.material = material
    }
}