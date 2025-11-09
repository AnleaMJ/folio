import { Howl, Howler } from 'howler'
import { Game } from './Game.js'
import { remap, remapClamp, clamp } from './utilities/maths.js'

export class Audio
{
    constructor()
    {
        this.game = Game.getInstance()

        this.initiated = false
        this.groups = new Map()

        this.setMuteToggle()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 12)
    }

    init()
    {
        this.initiated = true

        this.setMusic()
        this.setAmbiants()
        this.setPunctuals()
        
        this.music.play()

        // Play all autoplays that didn't start because not initated
        this.groups.forEach((group, name) =>
        {
            for(const item of group)
            {
                if(item.autoplay && !item.playing)
                    item.play()
            }
        })
    }

    register(name, options = {})
    {
        const item = {}
        item.howl = new Howl({
            src: [ options.path ],
            pool: 2,
            autoplay: (this.initiated && options.autoplay) ?? false,
            loop: options.loop ?? false,
            volume: options.volume ?? 0.5,
            preload: options.preload ?? true,
            onloaderror: () =>
            {
                console.error(`Audio > Load error > ${options.path}`, options)
            },
            onend: () =>
            {
                item.playing = false
            }
        })
        item.positions = options.positions ?? null
        if(item.positions !== null && !(item.positions instanceof Array))
            item.positions = [ item.positions ]
        item.distanceFade = options.distanceFade ?? null
        item.rate = options.rate ?? 1
        item.volume = options.volume ?? 0.5
        item.antiSpam = options.antiSpam ?? 0.1
        item.lastPlay = -Infinity
        item.tickBinding = options.tickBinding ?? null
        item.playBinding = options.playBinding ?? null
        item.loaded = options.preload ?? true
        item.autoplay = options.autoplay ?? false
        item.playing = (this.initiated && options.autoplay) ?? false

        item.play = (...parameters) =>
        {
            if(!this.initiated)
            {
                return
            }

            // Load
            if(!item.loaded)
            {
                item.loaded = true
                item.howl.load()
            }

            // Anti spam
            if(item.antiSpam)
            {
                if(this.game.ticker.elapsed - item.lastPlay < item.antiSpam)
                    return
            }

            // Play binding
            if(typeof item.playBinding === 'function')
                item.playBinding(item, ...parameters)
                
            // Play
            item.howl.play()

            // Save last play for anti spam
            item.lastPlay = this.game.ticker.elapsed
            item.playing = true
        }

        // Save into groups
        let group = this.groups.get(name)

        if(!group)
        {
            group = []
            this.groups.set(name, group)
        }
        group.push(item)

        return item
    }

    setMusic()
    {
        this.music = new Howl({
            src: ['sounds/musics/she-moved-through-the-fair-(celtic)_main-full.mp3'],
            pool: 0,
            autoplay: false,
            loop: true,
            volume: 0.15
        })
    }

    setAmbiants()
    {
        this.register(
            'wind',
            {
                path: 'sounds/wind/13582-wind-in-forest-loop.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    item.volume = Math.pow(remapClamp(this.game.weather.wind.value, 0.3, 1, 0, 1), 3) * 0.7
                }
            }
        )

        this.register(
            'rain',
            {
                path: 'sounds/rain/soundjay_rain-on-leaves_main-01.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    item.volume = Math.pow(this.game.weather.rain.value, 2)
                }
            }
        )

        this.register(
            'waves',
            {
                path: 'sounds/waves/lake-waves.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const distanceToSide = Math.min(
                        this.game.terrain.size / 2 - Math.abs(this.game.player.position.x),
                        this.game.terrain.size / 2 - Math.abs(this.game.player.position.z)
                    )
                    item.volume = Math.pow(remapClamp(distanceToSide, 0, 40, 1, 0.1), 2) * 0.5
                }
            }
        )

        this.register(
            'floor',
            {
                path: 'sounds/floor/Source Stone Loop Small Rubbing Pebbles On Rubber 01.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const defaultElevation = 1.08
                    const elevationEffect = remapClamp(Math.abs(this.game.physicalVehicle.position.y - defaultElevation), 0, 2, 1, 0)
                    const speedEffect = Math.min(1, this.game.physicalVehicle.xzSpeed * 0.1)
                    // console.log(speedEffect)
                    item.volume = elevationEffect * speedEffect * 0.15
                    item.rate = 1.15
                }
            }
        )

        this.register(
            'floor',
            {
                path: 'sounds/floor/Source Stone Loop Small Rubbing Pebbles On Concrete 02.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const directionRatio = (1 - Math.abs(this.game.physicalVehicle.forwardRatio)) * 0.6
                    
                    let brakeEffect = Math.max(directionRatio, this.game.player.braking) * this.game.physicalVehicle.xzSpeed * 0.15 * this.game.physicalVehicle.wheels.inContactCount / 4
                    brakeEffect = clamp(brakeEffect, 0, 1)

                    const volume = brakeEffect * 0.4
                    const delta = volume - item.volume

                    if(delta > 0)
                        item.volume += delta * this.game.ticker.deltaScaled * 20
                    else
                        item.volume += delta * this.game.ticker.deltaScaled * 5
                    
                    item.rate = 0.8
                }
            }
        )

        this.register(
            'floor',
            {
                path: 'sounds/floor/Earth Loop Dumping Gravel Sack Bulk Falling 01.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    item.volume = this.groups.get('floor')[0].volume * 0.5
                    
                    item.rate = 1.2
                }
            }
        )

        this.register(
            'engine',
            {
                path: 'sounds/engine/muscle car engine loop idle.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const accelerating = Math.abs(this.game.player.accelerating) * 0.5
                    const boosting = this.game.player.boosting + 1
                    const volume = Math.max(0.05, accelerating * boosting * 0.8)
                    const delta = volume - item.volume
                    const easing = delta > 0 ? 10 : 2.5
                    
                    item.volume += delta * this.game.ticker.deltaScaled * easing

                    const rate = remapClamp(accelerating * boosting, 0, 1, 0.6, 1.1)
                    item.rate += (rate - item.rate) * this.game.ticker.deltaScaled * 5
                }
            }
        )

        this.register(
            'spin',
            {
                path: 'sounds/spin/41051 Glass stone turning loop 09-full.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    // const accelerating = Math.abs(this.game.player.accelerating) * 0.5
                    // const boosting = this.game.player.boosting + 1
                    // const volume = accelerating * boosting * 0.8
                    // const accelerating = Math.abs(this.game.player.accelerating) * 0.5
                    // const boosting = this.game.player.boosting + 1
                    const speedEffect = clamp(this.game.physicalVehicle.xzSpeed * 0.1, 0, 1)
                    const volume = speedEffect * 0.3
                    const delta = volume - item.volume
                    const easing = delta > 0 ? 10 : 2.5
                    
                    item.volume += delta * this.game.ticker.deltaScaled * easing

                    const rate = remapClamp(speedEffect, 0, 1, 1, 2)
                    item.rate += (rate - item.rate) * this.game.ticker.deltaScaled * 5
                }
            }
        )

        this.register(
            'energy',
            {
                path: 'sounds/energy/Energy_-_force_field_8_loop.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const accelerating = 0.5 + Math.abs(this.game.player.accelerating) * 0.5
                    const boosting = this.game.player.boosting
                    const volume = accelerating * boosting * 0.3
                    const delta = volume - item.volume
                    const easing = delta > 0 ? 10 : 1
                    
                    item.volume += delta * this.game.ticker.deltaScaled * easing

                    const rate = 0.95 + Math.abs(this.game.player.accelerating) * 0.3
                    item.rate += (rate - item.rate) * this.game.ticker.deltaScaled * 5
                }
            }
        )

        this.register(
            'energy',
            {
                path: 'sounds/energy/Energy_-_force_field_6_loop.mp3',
                autoplay: true,
                loop: true,
                volume: 0,
                tickBinding: (item) =>
                {
                    const accelerating = 0.5 + Math.abs(this.game.player.accelerating) * 0.5
                    const boosting = this.game.player.boosting
                    const volume = accelerating * boosting * 0.2
                    const delta = volume - item.volume
                    const easing = delta > 0 ? 10 : 2.5
                    
                    item.volume += delta * this.game.ticker.deltaScaled * easing
                }
            }
        )

        // Project Area + Cookie Area
        {
            const positions = []
            if(this.game.world.areas.cookieStand)
                positions.push(this.game.world.areas.cookieStand.references.get('spawner')[0].position)
            if(this.game.world.areas.projects)
                positions.push(this.game.world.areas.projects.references.get('oven')[0].position)

            if(positions.length)
            {
                this.game.audio.register(
                    'ovenFire',
                    {
                        path: 'sounds/burning/Mountain Audio - Fire Burning in a Wood Stove 1.mp3',
                        autoplay: true,
                        loop: true,
                        volume: 0.4,
                        positions: positions,
                        distanceFade: 13,
                    }
                )
            }
        }

        // Lab Area + Bonfire Area
        {
            const positions = []
            if(this.game.world.areas.lab)
                positions.push(this.game.world.areas.lab.references.get('fire')[0].position)

            if(positions.length)
            {
                this.game.audio.register(
                    'campfire',
                    {
                        path: 'sounds/burning/Fire Burning.mp3',
                        autoplay: true,
                        loop: true,
                        volume: 0.4,
                        positions: positions,
                        distanceFade: 13,
                    }
                )
            }
        }
    }

    setPunctuals()
    {
        this.register(
            'slide',
            {
                path: 'sounds/mecanism/slide.mp3',
                autoplay: false,
                volume: 0.18
            }
        )

        this.register(
            'click',
            {
                path: 'sounds/mecanism/click.mp3',
                autoplay: false,
                volume: 0.25,
                playBinding: (item, isOpen = true) =>
                {
                    item.rate = isOpen ? 1 : 0.6
                }
            }
        )

        this.register(
            'assemble',
            {
                path: 'sounds/mecanism/assemble.mp3',
                autoplay: false,
                volume: 0.3
            }
        )
    }

    setMuteToggle()
    {
        this.muteToggle = {}
        this.muteToggle.buttonElement = this.game.domElement.querySelector('.audio-toggle')

        this.muteToggle.active = false

        this.muteToggle.toggle = () =>
        {
            if(this.muteToggle.active)
                this.muteToggle.deactivate()
            else
                this.muteToggle.activate()
        }

        this.muteToggle.activate = () =>
        {
            if(this.muteToggle.active)
                return
            
            Howler.mute(true)
            this.muteToggle.active = true
            this.muteToggle.buttonElement.classList.remove('is-active')
            localStorage.setItem('soundToggle', '1')
        }

        this.muteToggle.deactivate = () =>
        {
            if(!this.muteToggle.active)
                return
            
            Howler.mute(false)
            this.muteToggle.active = false
            this.muteToggle.buttonElement.classList.add('is-active')
            localStorage.setItem('soundToggle', '0')
        }

        const soundToggleLocal = localStorage.getItem('soundToggle')
        if(soundToggleLocal !== null && soundToggleLocal === '1')
            this.muteToggle.activate()

        this.muteToggle.buttonElement.addEventListener('click', this.muteToggle.toggle)

        // Tab focus / blur
        window.addEventListener('blur', () =>
        {
            Howler.mute(true)
        })

        window.addEventListener('focus', () =>
        {
            if(!this.muteToggle.active)
                Howler.mute(false)
        })

    }

    update()
    {
        this.globalRate = this.game.time.scale / this.game.time.defaultScale
        this.groups.forEach((group) =>
        {
            for(const item of group)
            {
                // Apply tick binding
                if(typeof item.tickBinding === 'function')
                {
                    item.tickBinding(item)
                }

                // Positional and distance fade
                let distanceFadeMultiplier = 1
                if(item.positions && item.howl.playing())
                {
                    let closestDistance = Infinity
                    let closestPosition = null

                    for(const position of item.positions)
                    {
                        const distance = position.distanceTo(this.game.view.focusPoint.position)

                        if(distance < closestDistance)
                        {
                            closestDistance = distance
                            closestPosition = position
                        }
                    }

                    const cameraRelativePosition = closestPosition.clone()
                    cameraRelativePosition.applyMatrix4(this.game.view.camera.matrixWorldInverse)
                    cameraRelativePosition.normalize()
                    cameraRelativePosition.z *= 0.1

                    if(item.distanceFade)
                    {
                        distanceFadeMultiplier = remapClamp(closestDistance, 0, item.distanceFade, 1, 0)
                    }

                    if(distanceFadeMultiplier > 0)
                        item.howl.pos(cameraRelativePosition.x, cameraRelativePosition.y, cameraRelativePosition.z)
                }

                // Rate (apply global too)
                item.howl.rate(item.rate * this.globalRate)

                // Volume
                item.howl.volume(item.volume * distanceFadeMultiplier)
            }
        })
    }
}
