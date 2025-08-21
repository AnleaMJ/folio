import { Events } from '../Events.js'
import { Game } from '../Game.js'
import { Gamepad } from './Gamepad.js'
import { Pointer } from './Pointer.js'
import Keyboard from './Keyboard.js'
import { Nipple } from './Nipple.js'
import { TouchButtons } from './TouchButtons.js'
import { Wheel } from './Wheel.js'

export class Inputs
{
    static MODE_MOUSEKEYBOARD = 1
    static MODE_GAMEPAD = 2
    static MODE_TOUCH = 3

    constructor(actions = [], filters = [])
    {
        this.game = Game.getInstance()
        this.events = new Events()

        this.actions = new Map()
        this.filters = new Set()
        this.mode = Inputs.MODE_MOUSEKEYBOARD

        this.setKeyboard()
        this.setGamepad()
        this.setPointer()
        this.setWheel()
        this.setNipple()
        this.setTouchButtons()

        this.addActions(actions)
        
        for(const filter of filters)
            this.filters.add(filter)

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 0)
    }

    setKeyboard()
    {
        this.keyboard = new Keyboard()

        this.keyboard.events.on('down', (key) =>
        {
            this.updateMode(Inputs.MODE_MOUSEKEYBOARD)
            this.start(`Keyboard.${key}`)
        })

        this.keyboard.events.on('up', (key) =>
        {
            this.updateMode(Inputs.MODE_MOUSEKEYBOARD)
            this.end(`Keyboard.${key}`)
        })
    }

    setGamepad()
    {
        this.gamepad = new Gamepad()

        this.gamepad.events.on('down', (key) =>
        {
            this.updateMode(Inputs.MODE_GAMEPAD)
            this.start(`Gamepad.${key.name}`, key.value)
        })

        this.gamepad.events.on('up', (key) =>
        {
            this.updateMode(Inputs.MODE_GAMEPAD)
            this.end(`Gamepad.${key.name}`)
        })

        this.gamepad.events.on('change', (key) =>
        {
            this.updateMode(Inputs.MODE_GAMEPAD)
            this.change(`Gamepad.${key.name}`, key.value)
        })

        this.gamepad.events.on('joystickChange', (joystick) =>
        {
            this.change(`Gamepad.joystick${joystick.name.charAt(0).toUpperCase() + joystick.name.slice(1)}`, { x: joystick.x, y: joystick.y, radius: joystick.radius, active: joystick.active })
        })
    }

    setPointer()
    {
        this.pointer = new Pointer(this.game.canvasElement)

        this.pointer.events.on('down', () =>
        {
            this.updateMode(this.pointer.mode === Pointer.MODE_MOUSE ? Inputs.MODE_MOUSEKEYBOARD : Inputs.MODE_TOUCH)
            this.start('Pointer.any', { x: this.pointer.current.x, y: this.pointer.current.y })
        })

        this.pointer.events.on('up', () =>
        {
            this.updateMode(this.pointer.mode === Pointer.MODE_MOUSE ? Inputs.MODE_MOUSEKEYBOARD : Inputs.MODE_TOUCH)
            this.end('Pointer.any', { x: this.pointer.current.x, y: this.pointer.current.y })
        })

        this.pointer.events.on('move', () =>
        {
            this.updateMode(this.pointer.mode === Pointer.MODE_MOUSE ? Inputs.MODE_MOUSEKEYBOARD : Inputs.MODE_TOUCH)
            this.change('Pointer.any', { x: this.pointer.current.x, y: this.pointer.current.y })
        })
    }

    setWheel()
    {
        this.wheel = new Wheel()

        this.wheel.events.on('roll', (value) =>
        {
            this.updateMode(Inputs.MODE_MOUSEKEYBOARD)
            this.start('Wheel.roll', value, false)
        })
    }

    setNipple()
    {
        this.nipple = new Nipple(this.game.domElement, this.game.canvasElement)
    }

    setTouchButtons()
    {
        this.touchButtons = new TouchButtons()
    }

    addActions(actions)
    {
        for(const action of actions)
        {
            const formatedAction = {...action}
            formatedAction.active = false
            formatedAction.value = 0
            formatedAction.trigger = null
            formatedAction.activeKeys = new Set()

            this.actions.set(action.name, formatedAction)
        }
    }

    checkCategory(action)
    {
        // No filter => Allow all
        if(this.filters.size === 0)
            return true

        // Has filter but no category on action => Forbid
        if(action.categories.length === 0)
            return true

        // Has matching category and filter => All
        for(const category of action.categories)
        {
            if(this.filters.has(category))
                return true
        }

        // Otherwise => Forbid
        return false
    }

    start(key, value = 1, isToggle = true)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && this.checkCategory(action))
            {
                action.value = value
                action.activeKeys.add(key)
                action.trigger = 'start'

                // Can be active or inactive => trigger event only on change
                if(isToggle)
                {
                    if(!action.active)
                    {
                        action.active = true
                        
                        this.events.trigger('actionStart', [ action ])
                        this.events.trigger(action.name, [ action ])
                    }
                }

                // Trigger event whenever action starts (no "end")
                else
                {
                    this.events.trigger('actionStart', [ action ])
                    this.events.trigger(action.name, [ action ])
                }
            }
        }
    }

    end(key, value = 0)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && action.active)
            {
                action.activeKeys.delete(key)

                if(action.activeKeys.size === 0)
                {
                    action.active = false
                    action.value = value
                    action.trigger = 'end'

                    this.events.trigger('actionEnd', [ action ])
                    this.events.trigger(action.name, [ action ])
                }
            }
        }
    }

    change(key, value = 1)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && this.checkCategory(action))
            {
                // Test if value has changed
                // - number => Direct comparaison
                // - object => Every property comparaison
                let hasChanged = false

                if(typeof value === 'number')
                {
                    if(action.value !== value)
                        hasChanged = true
                }
                else if(typeof value === 'object')
                {
                    const keys = Object.keys(value)

                    for(const key of keys)
                    {
                        if(action.value[key] !== value[key])
                            hasChanged = true
                    }
                }

                if(hasChanged)
                {
                    action.value = value
                    action.trigger = 'change'

                    this.events.trigger('actionChange', [ action ])
                    this.events.trigger(action.name, [ action ])
                }
            }
        }
    }

    updateMode(mode)
    {
        if(mode === this.mode)
            return

        this.mode = mode
        
        if(this.mode === Inputs.MODE_TOUCH)
            this.touchButtons.activate()
        else
            this.touchButtons.deactivate()

        this.events.trigger('modeChange', [this.mode])
    }

    update()
    {
        this.pointer.update()
        this.gamepad.update()
    }
}