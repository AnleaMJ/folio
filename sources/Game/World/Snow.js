import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { cameraNormalMatrix, color, cross, float, Fn, materialNormal, min, mix, modelNormalMatrix, modelViewMatrix, positionGeometry, positionWorld, texture, uniform, varying, vec2, vec3, vec4 } from 'three/tsl'

export class Snow
{
    constructor()
    {
        this.game = Game.getInstance()

        this.size = this.game.view.optimalArea.radius * 2
        this.subdivisions = 128
        this.subdivisionSpan = this.game.view.optimalArea.radius * 2 / this.subdivisions

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '⛇ Snow',
                expanded: true,
            })
        }

        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    setGeometry()
    {
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.subdivisions, this.subdivisions)
        this.geometry.rotateX(- Math.PI * 0.5)
    }

    setMaterial()
    {
        this.material = new THREE.MeshLambertNodeMaterial({ color: '#ffffff', transparent: true, wireframe: false })

        this.roundedPosition = uniform(vec2(0))
        this.groundDataDelta = uniform(vec2(0))
        this.colorTop = uniform(color('#ffffff'))
        this.colorBottom = uniform(color('#bceeff'))
        this.colorEdgeTop = uniform(0.292)
        this.colorEdgeBottom = uniform(0.022)
        this.normalNeighbourShift = uniform(this.subdivisionSpan)
        this.elevation = uniform(0)
        this.noiseMultiplier = uniform(1)
        this.noise1Frequency = uniform(0.11)
        this.noise2Frequency = uniform(0.075)

        const baseColor = varying(color())
        const deltaY = varying(float())
        
        const elevationNode = Fn(([position]) =>
        {
            const elevation = this.elevation.toVar()

            // Terrain
            const terrainUv = this.game.terrainData.worldPositionToUvNode(position.xy)
            const terrainData = this.game.terrainData.terrainDataNode(terrainUv)

            elevation.addAssign(terrainData.b.remap(0, 1, 0, -2))

            // Noise
            const noiseUv1 = position.mul(this.noise1Frequency).xy
            const noise1 = texture(this.game.noises.texture, noiseUv1).r

            const noiseUv2 = position.mul(this.noise2Frequency).xy
            const noise2 = texture(this.game.noises.texture, noiseUv2).r

            elevation.addAssign(noise1.mul(noise2).smoothstep(0, 1).mul(this.noiseMultiplier))

            // Wheel tracks
            const groundDataColor = texture(
                this.game.groundData.renderTarget.texture,
                position.xy.sub(- this.game.groundData.halfSize).sub(this.roundedPosition).add(this.groundDataDelta).div(this.game.groundData.size)
            )

            const wheelsTracksHeight = groundDataColor.a.oneMinus().add(0.1).toVar()
            elevation.assign(min(wheelsTracksHeight, elevation))


            return elevation
        })

        this.material.positionNode = Fn(() =>
        {
            // Position / Normal
            const positionA = positionGeometry.toVar()
            positionA.x.addAssign(this.roundedPosition.x)
            positionA.z.addAssign(this.roundedPosition.y)

            const positionB = positionA.toVar().add(vec3(this.normalNeighbourShift, 0, 0))
            const positionC = positionA.toVar().add(vec3(0, 0, this.normalNeighbourShift.negate()))

            positionA.y.assign(elevationNode(positionA.xz))
            positionB.y.assign(elevationNode(positionB.xz))
            positionC.y.assign(elevationNode(positionC.xz))

            // Terrain data
            const terrainUv = this.game.terrainData.worldPositionToUvNode(positionA.xz)
            const terrainData = this.game.terrainData.terrainDataNode(terrainUv)
            const terrainColor = this.game.terrainData.colorNode(terrainData)

            // Normal
            const newNormal = cross(positionA.sub(positionB), positionA.sub(positionC)).normalize()

            // const normalMixStrength = terrainData.b.remapClamp(0, 0.2, 0, 1)
            // newNormal.assign(mix(newNormal, vec3(0, 1, 0), normalMixStrength))

            materialNormal.assign(modelViewMatrix.mul(vec4(newNormal, 0)))

            // Push down further more in water (after calculating normal)
            const waterDrop = terrainData.b.remapClamp(0, 0.3, 0, -3)
            positionA.y.addAssign(waterDrop)

            // Color
            baseColor.assign(terrainColor)

            // Delta to floor
            deltaY.assign(positionA.y.sub(terrainData.b.mul(-2)))
            
            return positionA
        })()

        const totalShadow = this.game.lighting.addTotalShadowToMaterial(this.material)

        this.material.outputNode = Fn(() =>
        {
            const lightOutput = this.game.lighting.lightOutputNodeBuilder(this.colorTop, totalShadow, false, false).rgb
            const alpha = deltaY.smoothstep(this.colorEdgeBottom, this.colorEdgeTop)

            return vec4(lightOutput, alpha)
        })()

        // Debug
        if(this.game.debug.active)
        {
            this.game.debug.addThreeColorBinding(this.debugPanel, this.colorTop.value, 'colorTop')
            this.debugPanel.addBinding(this.colorEdgeTop, 'value', { label: 'colorEdgeTop', min: - 2, max: 2, step: 0.001 })
            this.game.debug.addThreeColorBinding(this.debugPanel, this.colorBottom.value, 'colorBottom')
            this.debugPanel.addBinding(this.colorEdgeBottom, 'value', { label: 'colorEdgeBottom', min: - 2, max: 2, step: 0.001 })
            this.debugPanel.addBinding(this.normalNeighbourShift, 'value', { label: 'normalNeighbourShift', min: 0, max: 0.4, step: 0.001 })
            this.debugPanel.addBinding(this.elevation, 'value', { label: 'elevation', min: -1, max: 1, step: 0.001 })
            this.debugPanel.addBinding(this.noiseMultiplier, 'value', { label: 'noiseMultiplier', min: 0, max: 2, step: 0.001 })
            this.debugPanel.addBinding(this.noise1Frequency, 'value', { label: 'noise1Frequency', min: 0, max: 0.4, step: 0.001 })
            this.debugPanel.addBinding(this.noise2Frequency, 'value', { label: 'noise2Frequency', min: 0, max: 0.4, step: 0.001 })
        }
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = 0
        this.mesh.castShadow = false
        this.mesh.receiveShadow = true
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)
    }

    update()
    {
        // Rounded position
        this.roundedPosition.value.x = Math.round(this.game.view.optimalArea.position.x / this.subdivisionSpan) * this.subdivisionSpan
        this.roundedPosition.value.y = Math.round(this.game.view.optimalArea.position.z / this.subdivisionSpan) * this.subdivisionSpan

        // Ground data delta
        this.groundDataDelta.value.set(
            this.roundedPosition.value.x - this.game.groundData.focusPoint.x,
            this.roundedPosition.value.y - this.game.groundData.focusPoint.y
        )
    }
}