import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three/webgpu'

import { Debug } from './Debug.js'
import { Inputs } from './Inputs.js'
import { Physics } from './Physics/Physics.js'
import { Rendering } from './Rendering.js'
import { ResourcesLoader } from './ResourcesLoader.js'
import { Ticker } from './Ticker.js'
import { Time } from './Time.js'
import { Player } from './Player.js'
import { View } from './View.js'
import { Viewport } from './Viewport.js'
import { World } from './World/World.js'
import { GroundData } from './GroundData/GroundData.js'
import { Monitoring } from './Monitoring.js'
import { Lighting } from './Ligthing.js'
import { Materials } from './Materials.js'
import { Entities } from './Entities.js'
import { Fog } from './Fog.js'
import { DayCycles } from './Cycles/DayCycles.js'
import { Weather } from './Weather.js'
import { Noises } from './Noises.js'
import { Wind } from './Wind.js'
import { TerrainData } from './TerrainData.js'
import { Explosions } from './Explosions.js'
import { YearCycles } from './Cycles/YearCycles.js'
import { Server } from './Server.js'
import { Modals } from './Modals.js'
import { PhysicsVehicle } from './Physics/PhysicsVehicle.js'
import { PhysicsWireframe } from './Physics/PhysicsWireframe.js'
import { Areas } from './Areas.js'
import { Overlay } from './Overlay.js'
import { Tornado } from './Tornado.js'

export class Game
{
    static getInstance()
    {
        return Game.instance
    }

    constructor()
    {
        // Singleton
        if(Game.instance)
            return Game.instance

        Game.instance = this
        console.log('init')

        // Rapier init
        RAPIER.init().then(() =>
        {
            console.log('initiated')
            console.log(RAPIER)

            // Load resources
            this.resourcesLoader = new ResourcesLoader()
            this.resourcesLoader.load(
                [
                    { path: 'foliage/foliage.png', type: 'texture', name: 'foliateTexture' },
                    { path: 'bushes/bushesReferences.glb', type: 'gltf', name: 'bushesReferences' },
                    { path: 'vehicle/default.glb', type: 'gltf', name: 'vehicle' },
                    { path: 'playground/playgroundVisual.glb', type: 'gltf', name: 'playgroundVisual' },
                    { path: 'playground/playgroundPhysical.glb', type: 'gltf', name: 'playgroundPhysical' },
                    { path: 'floor/keys.png', type: 'texture', name: 'floorKeysTexture' },
                    { path: 'flowers/flowersReferences.glb', type: 'gltf', name: 'flowersReferencesModel' },
                    { path: 'bricks/bricksReferences.glb', type: 'gltf', name: 'bricksReferencesModel' },
                    { path: 'bricks/bricksVisual.glb', type: 'gltf', name: 'bricksVisualModel' },
                    { path: 'terrain/terrain.png', type: 'texture', name: 'terrainTexture' },
                    // { path: 'terrain/flatGrass.png', type: 'texture', name: 'terrainTexture' },
                    { path: 'terrain/terrain.glb', type: 'gltf', name: 'terrainModel' },
                    { path: 'birchTrees/birchTreesVisual.glb', type: 'gltf', name: 'birchTreesVisualModel' },
                    { path: 'birchTrees/birchTreesReferences.glb', type: 'gltf', name: 'birchTreesReferencesModel' },
                    { path: 'oakTrees/oakTreesVisual.glb', type: 'gltf', name: 'oakTreesVisualModel' },
                    { path: 'oakTrees/oakTreesReferences.glb', type: 'gltf', name: 'oakTreesReferencesModel' },
                    { path: 'cherryTrees/cherryTreesVisual.glb', type: 'gltf', name: 'cherryTreesVisualModel' },
                    { path: 'cherryTrees/cherryTreesReferences.glb', type: 'gltf', name: 'cherryTreesReferencesModel' },
                    { path: 'scenery/sceneryStaticVisual.glb', type: 'gltf', name: 'sceneryStaticVisualModel' },
                    { path: 'scenery/sceneryStaticPhysical.glb', type: 'gltf', name: 'sceneryStaticPhysicalModel' },
                    { path: 'scenery/sceneryDynamic.glb', type: 'gltf', name: 'sceneryDynamicModel' },
                    { path: 'poleLights/poleLightsVisual.glb', type: 'gltf', name: 'poleLightsVisualModel' },
                    { path: 'poleLights/poleLightsPhysical.glb', type: 'gltf', name: 'poleLightsPhysicalModel' },
                    { path: 'whispers/whisperBeam.png', type: 'texture', name: 'whisperBeamTexture' },
                    { path: 'scenery/satanStar.png', type: 'texture', name: 'satanStarTexture' },
                    { path: 'tornado/tornadoPath.glb', type: 'gltf', name: 'tornadoPathModel' },
                    
                    // { path: 'christmas/christmasTreeVisual.glb', type: 'gltf', name: 'christmasTreeVisualModel' },
                    // { path: 'christmas/christmasTreePhysical.glb', type: 'gltf', name: 'christmasTreePhysicalModel' },
                    // { path: 'christmas/christmasGiftVisual.glb', type: 'gltf', name: 'christmasGiftVisualModel' },
                    // { path: 'christmas/christmasGiftReferences.glb', type: 'gltf', name: 'christmasGiftReferencesModel' },
                ],
                (resources) =>
                {
                    console.log('loaded')
                    this.resources = resources

                    this.resources.terrainTexture.flipY = false

                    // Init
                    this.init()
                }
            )
        })
    }

    init()
    {
        // Setup
        this.domElement = document.querySelector('.game')

        this.scene = new THREE.Scene()

        this.server = new Server()
        this.ticker = new Ticker()
        this.inputs = new Inputs([
            // Vehicle
            { name: 'forward',              category: 'vehicle', keys: [ 'ArrowUp', 'KeyW' ] },
            { name: 'right',                category: 'vehicle', keys: [ 'ArrowRight', 'KeyD' ] },
            { name: 'backward',             category: 'vehicle', keys: [ 'ArrowDown', 'KeyS' ] },
            { name: 'left',                 category: 'vehicle', keys: [ 'ArrowLeft', 'KeyA' ] },
            { name: 'boost',                category: 'vehicle', keys: [ 'ShiftLeft', 'ShiftRight' ] },
            { name: 'brake',                category: 'vehicle', keys: [ 'KeyB' ] },
            { name: 'reset',                category: 'vehicle', keys: [ 'KeyR' ] },
            { name: 'suspensions',           category: 'vehicle', keys: [ 'Numpad5', 'Space' ] },
            { name: 'suspensionsFront',      category: 'vehicle', keys: [ 'Numpad8' ] },
            { name: 'suspensionsBack',       category: 'vehicle', keys: [ 'Numpad2' ] },
            { name: 'suspensionsRight',      category: 'vehicle', keys: [ 'Numpad6' ] },
            { name: 'suspensionsLeft',       category: 'vehicle', keys: [ 'Numpad4' ] },
            { name: 'suspensionsFrontLeft',  category: 'vehicle', keys: [ 'Numpad7' ] },
            { name: 'suspensionsFrontRight', category: 'vehicle', keys: [ 'Numpad9' ] },
            { name: 'suspensionsBackRight',  category: 'vehicle', keys: [ 'Numpad3' ] },
            { name: 'suspensionsBackLeft',   category: 'vehicle', keys: [ 'Numpad1' ] },
            { name: 'whisper',              category: 'vehicle', keys: [ 'KeyT' ] },

            // UI
            { name: 'close',                category: 'ui', keys: [ 'Escape' ] },

            // Debug
            { name: 'viewToggle',           category: 'debug', keys: [ 'KeyV' ] },
            { name: 'debugToggle',          category: 'debug', keys: [ 'KeyH' ] },
        ])
        this.debug = new Debug()
        this.time = new Time()
        this.viewport = new Viewport(this.domElement)
        this.modals = new Modals()
        this.view = new View()
        this.rendering = new Rendering(() =>
        {
            this.noises = new Noises()
            // this.sounds = new Sounds()
            this.dayCycles = new DayCycles()
            this.yearCycles = new YearCycles()
            this.weather = new Weather()
            this.wind = new Wind()
            this.groundData = new GroundData()
            this.terrainData = new TerrainData()
            this.lighting = new Lighting()
            this.fog = new Fog()
            this.materials = new Materials()
            this.entities = new Entities()
            this.explosions = new Explosions()
            this.tornado = new Tornado()
            this.physics = new Physics()
            this.wireframe = new PhysicsWireframe()
            this.physicalVehicle = new PhysicsVehicle()
            this.areas = new Areas()
            this.player = new Player()
            this.world = new World()
            this.overlay = new Overlay()
            // this.monitoring = new Monitoring()

            this.rendering.renderer.setAnimationLoop((elapsedTime) => { this.ticker.update(elapsedTime) })
        })
    }
}

