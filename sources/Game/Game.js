import * as THREE from 'three/webgpu'

import { Debug } from './Debug.js'
import { Inputs } from './Inputs/Inputs.js'
import { Physics } from './Physics/Physics.js'
import { Rendering } from './Rendering.js'
import { ResourcesLoader } from './ResourcesLoader.js'
import { Ticker } from './Ticker.js'
import { Time } from './Time.js'
import { Player } from './Player.js'
import { View } from './View.js'
import { Viewport } from './Viewport.js'
import { World } from './World/World.js'
import { Tracks } from './Tracks.js'
import { Monitoring } from './Monitoring.js'
import { Lighting } from './Ligthing.js'
import { Materials } from './Materials.js'
import { Objects } from './Objects.js'
import { Fog } from './Fog.js'
import { DayCycles } from './Cycles/DayCycles.js'
import { Weather } from './Weather.js'
import { Noises } from './Noises.js'
import { Wind } from './Wind.js'
import { Terrain } from './Terrain.js'
import { Explosions } from './Explosions.js'
import { YearCycles } from './Cycles/YearCycles.js'
import { Server } from './Server.js'
import { Modals } from './Modals.js'
import { PhysicsVehicle } from './Physics/PhysicsVehicle.js'
import { PhysicsWireframe } from './Physics/PhysicsWireframe.js'
import { Zones } from './Zones.js'
import { Overlay } from './Overlay.js'
import { Tornado } from './Tornado.js'
import { InteractivePoints } from './InteractivePoints.js'
import { Respawns } from './Respawns.js'
import { Audio } from './Audio.js'
import { ClosingManager } from './ClosingManager.js'
import { RayCursor } from './RayCursor.js'
import { Water } from './Water.js'
import { Reveal } from './Reveal.js'
import { KonamiCode } from './KonamiCode.js'
import { Achievements } from './Achievements.js'
import { Notifications } from './Notifications.js'
import { Quality } from './Quality.js'
import { Menu } from './Menu.js'
import { Title } from './Title.js'

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

        this.init()
    }

    async init()
    {
        // Setup
        this.domElement = document.querySelector('.game')
        this.canvasElement = this.domElement.querySelector('.js-canvas')

        // First batch for intro
        this.scene = new THREE.Scene()
        this.debug = new Debug()
        this.resourcesLoader = new ResourcesLoader()
        this.quality = new Quality()
        this.server = new Server()
        this.ticker = new Ticker()
        this.time = new Time()
        this.dayCycles = new DayCycles()
        this.yearCycles = new YearCycles()
        this.audio = new Audio()
        this.notifications = new Notifications()
        this.inputs = new Inputs([], [ 'intro' ])
        this.rayCursor = new RayCursor()
        this.viewport = new Viewport(this.domElement)
        this.modals = new Modals()
        this.menu = new Menu()
        this.rendering = new Rendering()
        await this.rendering.setRenderer()
        this.resources = await this.resourcesLoader.load([
            [ 'respawnsReferencesModel',    'respawns/respawnsReferences-draco.glb', 'gltf' ],
            [ 'behindTheSceneStarsTexture', 'behindTheScene/stars.ktx',              'textureKtx', (resource) => { resource.colorSpace = THREE.SRGBColorSpace; resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; } ],
            [ 'soundTexture',               'intro/sound.ktx',                       'textureKtx', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.repeat.x = 0.5; } ],
            [ 'paletteTexture',             'palette.ktx',                           'textureKtx', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.colorSpace = THREE.SRGBColorSpace; } ],

        ])
        this.respawns = new Respawns(import.meta.env.VITE_PLAYER_SPAWN || 'landing')
        this.view = new View()
        this.rendering.setPostprocessing()
        this.rendering.start()
        this.reveal = new Reveal()
        this.noises = new Noises()
        this.weather = new Weather()
        this.wind = new Wind()
        this.tracks = new Tracks()
        this.lighting = new Lighting()
        this.fog = new Fog()
        this.water = new Water()
        this.materials = new Materials()
        this.objects = new Objects()
        this.explosions = new Explosions()
        this.world = new World()

        // Load and init RAPIER
        const rapierPromise = import('@dimforge/rapier3d')

        // Load rest of resources
        const resourcesPromise = this.resourcesLoader.load(
            [
                [ 'foliageTexture',                        'foliage/foliageSDF.ktx',                                     'textureKtx', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; } ],
                [ 'bushesReferences',                      'bushes/bushesReferences-draco.glb',                          'gltf'    ],
                [ 'vehicle',                               'vehicle/default-draco.glb',                                  'gltf'    ],
                [ 'playgroundVisual',                      'playground/playgroundVisual-draco.glb',                      'gltf'    ],
                [ 'playgroundPhysical',                    'playground/playgroundPhysical-draco.glb',                    'gltf'    ],
                [ 'flowersReferencesModel',                'flowers/flowersReferences-draco.glb',                        'gltf'    ],
                [ 'bricksModel',                           'bricks/bricks-draco.glb',                                    'gltf'    ],
                [ 'fencesModel',                           'fences/fences-draco.glb',                                    'gltf'    ],
                [ 'benchesModel',                          'benches/benches-draco.glb',                                  'gltf'    ],
                [ 'explosiveCratesModel',                  'explosiveCrates/explosiveCrates-draco.glb',                  'gltf'    ],
                [ 'lanternsModel',                         'lanterns/lanterns-draco.glb',                                'gltf'    ],
                [ 'terrainTexture',                        'terrain/terrain.ktx',                                        'textureKtx', (resource) => { resource.flipY = false; } ],
                [ 'terrainModel',                          'terrain/terrain-draco.glb',                                  'gltf'    ],
                [ 'floorSlabsTexture',                     'floor/slabs.ktx',                                            'textureKtx', (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'birchTreesVisualModel',                 'birchTrees/birchTreesVisual-draco.glb',                      'gltf'    ],
                [ 'birchTreesReferencesModel',             'birchTrees/birchTreesReferences-draco.glb',                  'gltf'    ],
                [ 'oakTreesVisualModel',                   'oakTrees/oakTreesVisual-draco.glb',                          'gltf'    ],
                [ 'oakTreesReferencesModel',               'oakTrees/oakTreesReferences.glb',                            'gltf'    ],
                [ 'cherryTreesVisualModel',                'cherryTrees/cherryTreesVisual-draco.glb',                    'gltf'    ],
                [ 'cherryTreesReferencesModel',            'cherryTrees/cherryTreesReferences-draco.glb',                'gltf'    ],
                [ 'sceneryModel',                          'scenery/scenery-draco.glb',                                  'gltf'    ],
                [ 'areasModel',                            'areas/areas-draco.glb',                                      'gltf'    ],
                [ 'poleLightsModel',                       'poleLights/poleLights-draco.glb',                            'gltf'    ],
                [ 'whisperFlameTexture',                   'whispers/whisperFlame.ktx',                                  'textureKtx', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'satanStarTexture',                      'areas/satanStar.ktx',                                        'textureKtx', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'tornadoPathReferencesModel',            'tornado/tornadoPathReferences-draco.glb',                    'gltf'    ],
                [ 'overlayPatternTexture',                 'overlay/overlayPattern.ktx',                                 'textureKtx', (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.magFilter = THREE.NearestFilter; resource.minFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconCrossTexture',  'interactivePoints/interactivePointsKeyIconCross.ktx',        'textureKtx', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconEnterTexture',  'interactivePoints/interactivePointsKeyIconEnter.ktx',        'textureKtx', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconATexture',      'interactivePoints/interactivePointsKeyIconA.ktx',            'textureKtx', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'jukeboxMusicNotes',                     'jukebox/jukeboxMusicNotes.ktx',                              'textureKtx', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'achievementsGlyphsTexture',             'achievements/glyphs.ktx',                                    'textureKtx', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; } ],
                [ 'careerFreelancerTexture',               'career/careerFreelancer.ktx',                                'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerHeticTexture',                    'career/careerHetic.ktx',                                     'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerImmersiveGardenTexture',          'career/careerImmersiveGarden.ktx',                           'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerIRLTeacherTexture',               'career/careerIRLTeacher.ktx',                                'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerOnlineTeacherTexture',            'career/careerOnlineTeacher.ktx',                             'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerUzikTexture',                     'career/careerUzik.ktx',                                      'textureKtx', (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
            ],
            (toLoad, total) =>
            {
                this.world.intro.updateProgress(1 - toLoad / total)
            }
        )

        const [ newResources, RAPIER ] = await Promise.all([ resourcesPromise, rapierPromise ])
        this.RAPIER = RAPIER
        this.resources = { ...newResources, ...this.resources }

        this.terrain = new Terrain()
        this.physics = new Physics()
        this.wireframe = new PhysicsWireframe()
        this.physicalVehicle = new PhysicsVehicle()
        this.zones = new Zones()
        this.player = new Player()
        this.interactivePoints = new InteractivePoints()
        this.overlay = new Overlay()
        this.closingManager = new ClosingManager()
        this.konamiCode = new KonamiCode()
        this.achievements = new Achievements()
        this.tornado = new Tornado()
        this.title = new Title()
        // this.monitoring = new Monitoring()
        this.world.init(1)

        this.ticker.wait(3, () =>
        {
            this.reveal.updateStep(0)
        })

        if(this.debug.active)
        {
            this.achievements.setProgress('debug', 1)
        }
    }
}

