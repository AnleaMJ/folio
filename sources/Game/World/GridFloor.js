import * as THREE from 'three'
import { Game } from '../Game.js'
import MeshGridMaterial, { MeshGridMaterialLine } from '../Materials/MeshGridMaterial.js'

export class GridFloor
{
    constructor()
    {
        this.game = new Game()

        this.setVisual()
        this.setPhysical()
    }

    setVisual()
    {
        const lines = [
            // new MeshGridMaterialLine(0x444444, 0.1, 0.04),
            new MeshGridMaterialLine(0x705df2, 1, 0.03, 0.2),
            new MeshGridMaterialLine(0xffffff, 10, 0.003, 1),
        ]

        const uvGridMaterial = new MeshGridMaterial({
            color: 0x1b191f,
            scale: 0.001,
            antialiased: true,
            reference: 'uv', // uv | world
            side: THREE.DoubleSide,
            lines
        })

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            uvGridMaterial
        )
        ground.position.y -= 0.02
        ground.rotation.x = - Math.PI * 0.5
        this.game.scene.add(ground)

        // Debug
        if(this.game.debug.active)
        {
            const gridFolder = this.game.debug.panel.addFolder({
                title: '🌐 Grid Floor',
                expanded: false,
            })

            gridFolder.addBinding(uvGridMaterial, 'scale', { min: 0, max: 0.002, step: 0.0001 })

            for(const line of lines)
            {
                const lineFolder = gridFolder.addFolder({
                    title: 'Line',
                    expanded: true,
                })
                lineFolder.addBinding(line.scale, 'value', { label: 'scale', min: 0, max: 1, step: 0.001 })
                lineFolder.addBinding(line.thickness, 'value', { label: 'thickness', min: 0, max: 1, step: 0.001 })
                lineFolder.addBinding(line.offset, 'value', { label: 'offset', min: 0, max: 1, step: 0.001 })
                lineFolder.addBinding(line.cross, 'value', { label: 'cross', min: 0, max: 1, step: 0.001 })
                lineFolder.addBinding({ color: '#' + line.color.value.getHexString(THREE.SRGBColorSpace) }, 'color').on('change', tweak => line.color.value.set(tweak.value))
            }
        }
    }

    setPhysical()
    {
        this.game.physics.addEntity({
            type: 'fixed',
            colliders: [ { shape: 'cuboid', parameters: [ 1000, 1, 1000 ], position: { x: 0, y: - 1.01, z: 0 } } ]
        })
    }
}