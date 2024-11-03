import * as THREE from 'three'

import { Game } from '../Game.js'
import { color } from 'three'
import { texture } from 'three'
import { uniform } from 'three'
import { mix } from 'three'
import { uv } from 'three'

export class Terrain
{
    constructor()
    {
        this.game = new Game()

        this.group = new THREE.Group()
        this.game.resources.load(
            [
                { path: './terrain/terrainData.png', type: 'texture', name: 'terrainDataTexture' },
                { path: './perlin.png', type: 'texture', name: 'perlinTexture' }
            ],
            (resources) =>
            {
                this.resources = resources

                this.resources.terrainDataTexture.wrapS = THREE.RepeatWrapping
                this.resources.terrainDataTexture.wrapT = THREE.RepeatWrapping

                this.resources.perlinTexture.wrapS = THREE.RepeatWrapping
                this.resources.perlinTexture.wrapT = THREE.RepeatWrapping

                this.setPhysics()
                this.setFloor()
            }
        )
    }

    setPhysics()
    {
        this.game.physics.addEntity({
            type: 'fixed',
            colliders: [ { shape: 'cuboid', parameters: [ 100, 1, 100 ], position: { x: 0, y: - 1, z: 0 } } ]
        })
    }

    setFloor()
    {
        const geometry = new THREE.PlaneGeometry(20, 20)
        geometry.rotateX(- Math.PI * 0.5)
        
        const material = new THREE.MeshBasicNodeMaterial()

        const grassColor = uniform(color('#928a20'))
        const dirtColor = uniform(color('#ffbb52'))

        const noise1 = texture(this.resources.perlinTexture, uv().mul(3)).x
        const noise2 = texture(this.resources.perlinTexture, uv().mul(1)).y
        const noise = noise1.add(noise2).div(2)
        const terrainData = texture(this.resources.terrainDataTexture)
        
        const noiseVariation = noise.sub(0.5).mul(2)
        const factor = terrainData.r.add(noiseVariation).clamp(0, 1)
        material.colorNode = mix(grassColor, dirtColor, factor)
        this.floor = new THREE.Mesh(geometry, material)
        this.game.scene.add(this.floor)

        // Debug
        if(this.game.debug.active)
        {
            const folder = this.game.debug.panel.addFolder({
                title: '🏔️ Terrain',
                expanded: false,
            })

            folder.addBinding({ color: '#' + grassColor.value.getHexString(THREE.SRGBColorSpace) }, 'color', { label: 'grassColor' }).on('change', tweak => grassColor.value.set(tweak.value))
            folder.addBinding({ color: '#' + dirtColor.value.getHexString(THREE.SRGBColorSpace) }, 'color', { label: 'dirtColor' }).on('change', tweak => dirtColor.value.set(tweak.value))
        }
    }
}