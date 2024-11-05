import * as THREE from 'three'
import { Game } from '../Game.js'
import { mix, positionWorld, transformedNormalView, matcapUV, modelViewMatrix, positionView, positionLocal, float, mod, texture, transformNormalToView, positionViewDirection, uniformArray, varying, vertexIndex, rotateUV, cameraPosition, vec4, cameraProjectionMatrix, cameraViewMatrix, atan2, billboarding, vec3, vec2, modelWorldMatrix, Fn, attribute, uniform, positionGeometry } from 'three'
import getWind from '../tsl/getWind.js'

export class Grass
{
    constructor()
    {
        this.game = new Game()

        this.details = 600
        this.size = 80
        this.count = this.details * this.details
        this.fragmentSize = this.size / this.details
        this.bladeWidthRatio = 1.5
        this.bladeHeightRatio = 3
        this.bladeHeightRandomness = 0.5
        this.positionRandomness = 1

        this.game.resources.load(
            [
                { path: 'matcaps/grassOnGreen.png', type: 'texture', name: 'matcapGrassOnGreen' },
                { path: 'noises-128x128.png', type: 'texture', name: 'noisesTexture' },
            ],
            (resources) =>
            {
                this.resources = resources
                this.resources.matcapGrassOnGreen.colorSpace = THREE.SRGBColorSpace
                this.resources.noisesTexture.wrapS = THREE.RepeatWrapping
                this.resources.noisesTexture.wrapT = THREE.RepeatWrapping
                this.init()
            }
        )
    }

    init()
    {
        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setGeometry()
    {
        const position = new Float32Array(this.count * 3 * 2)
        const randomness = new Float32Array(this.count * 3)

        for(let iX = 0; iX < this.details; iX++)
        {
            const fragmentX = (iX / this.details - 0.5) * this.size + this.fragmentSize * 0.5
            
            for(let iZ = 0; iZ < this.details; iZ++)
            {
                const fragmentZ = (iZ / this.details - 0.5) * this.size + this.fragmentSize * 0.5

                const i = (iX * this.details + iZ)
                const i3 = i * 3
                const i6 = i * 6

                // Center of the blade
                const positionX = fragmentX + (Math.random() - 0.5) * this.fragmentSize * this.positionRandomness
                const positionZ = fragmentZ + (Math.random() - 0.5) * this.fragmentSize * this.positionRandomness

                position[i6    ] = positionX
                position[i6 + 1] = positionZ

                position[i6 + 2] = positionX
                position[i6 + 3] = positionZ

                position[i6 + 4] = positionX
                position[i6 + 5] = positionZ

                // Randomness
                randomness[i3    ] = Math.random()
                randomness[i3 + 1] = Math.random()
                randomness[i3 + 2] = Math.random()
            }
        }
        
        this.geometry = new THREE.BufferGeometry()
        this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1)
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 2))
        this.geometry.setAttribute('randomness', new THREE.Float32BufferAttribute(randomness, 1))
    }

    setMaterial()
    {
        this.material = new THREE.MeshMatcapNodeMaterial()
        this.playerPosition = uniform(new THREE.Vector2())

        const vertexLoopIndex = varying(vertexIndex.toFloat().mod(3))
        const tipness = varying(vertexLoopIndex.step(0.5))
        const wind = varying(vec2())
        const bladePosition = varying(vec2())

        const bladeWidth = this.fragmentSize * this.bladeWidthRatio
        const bladeHalfWidth = bladeWidth * 0.5
        const bladeHeight = this.fragmentSize * this.bladeHeightRatio
        const shapeUniform = uniformArray([

                // Tip
                0,
                bladeHeight,

                // Left side
                bladeHalfWidth,
                0,

                // Right side
                - bladeHalfWidth,
                0,
        ])

        this.material.positionNode = Fn(() =>
        {
            // Blade position
            const position = attribute('position')

            const loopPosition = position.sub(this.playerPosition)
            const halfSize = float(this.size).mul(0.5).toVar()
            loopPosition.x.assign(mod(loopPosition.x.add(halfSize), this.size).sub(halfSize))
            loopPosition.y.assign(mod(loopPosition.y.add(halfSize), this.size).sub(halfSize))

            const position3 = vec3(loopPosition.x, 0, loopPosition.y).add(vec3(this.playerPosition.x, 0, this.playerPosition.y))
            const worldPosition = modelWorldMatrix.mul(position3).toVar()
            bladePosition.assign(worldPosition.xz)

            // Wheel tracks
            const wheelTracksColor = texture(
                this.game.vehicle.wheelTracks.renderTarget.texture,
                vec2(worldPosition.x, worldPosition.z).sub(-10).div(20)
            )

            // Height
            const height = attribute('randomness').mul(0.4).add(0.6).mul(wheelTracksColor.a.oneMinus())

            // Shape
            const shape = vec3(
                shapeUniform.element(vertexLoopIndex.mod(3).mul(2)),
                shapeUniform.element(vertexLoopIndex.mod(3).mul(2).add(1)).mul(height),
                0
            )

            // Vertex positioning
            const vertexPosition = position3.add(shape)

            // Wind
            wind.assign(getWind([this.resources.noisesTexture, worldPosition.xz]).mul(tipness).mul(1))
            vertexPosition.addAssign(vec3(wind.x, 0, wind.y))

            // Vertex rotation
            const angleToCamera = atan2(worldPosition.z.sub(cameraPosition.z), worldPosition.x.sub(cameraPosition.x)).add(- Math.PI * 0.5)
            vertexPosition.xz.assign(rotateUV(vertexPosition.xz, angleToCamera, worldPosition.xz))

            return vertexPosition
        })()

        this.material.normalNode = Fn(() =>
        {
            const normal = vec3(wind.y.mul(-10), 1, wind.y.mul(-10)).normalize()
            return transformNormalToView(normal)
        })()

        this.material.outputNode = Fn(() =>
        {
            const colorVariationUv = texture(this.resources.noisesTexture, bladePosition.mul(0.01))

            const inverseMatcapUV = matcapUV.sub(0.5).mul(-1).add(0.5).toVar()
            const newMatcapUv = mix(matcapUV, inverseMatcapUV, colorVariationUv.r)

            const matcapColor = texture(this.resources.matcapGrassOnGreen, newMatcapUv)
            const finalColor = matcapColor.mul(tipness)

            return vec4(finalColor.rgb, 1)
        })()

        // this.material.outputNode = Fn(() =>
        // {
        //     const wind = getWind([this.resources.noisesTexture, positionWorld.xz])
        //     // const finalColor = matcapColor.mul(tipness)

        //     return vec4(wind.xy, 0, 1)
        // })()

        // // const testGeometry = new THREE.PlaneGeometry(20, 20, 1, 1)
        // const testGeometry = new THREE.SphereGeometry(2, 32, 32)
        // testGeometry.rotateX(- Math.PI * 0.5)

        // const testMaterial = new THREE.MeshMatcapNodeMaterial({ depthTest: false, matcap: this.resources.matcapGrassOnGreen })
        // this.testPlane = new THREE.Mesh(testGeometry, testMaterial)
        // this.game.scene.add(this.testPlane)
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)
    }

    update()
    {
        this.playerPosition.value.set(this.game.vehicle.position.x, this.game.vehicle.position.z)
        // this.mesh.position.set(this.game.vehicle.position.x, 0, this.game.vehicle.position.z)
        // this.testPlane.position.set(this.game.vehicle.position.x, 0, this.game.vehicle.position.z)
    }
}