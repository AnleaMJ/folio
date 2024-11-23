import * as THREE from 'three'
import { Game } from '../Game.js'
import { FragmentObject } from './FragmentObject.js'

export class BlackFriday
{
    constructor()
    {
        this.game = new Game()

        this.element = document.querySelector('.black-friday')

        this.setIntro()
        this.setOutro()
        this.setFragments()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 10)

        this.game.inputs.events.on('close', (event) =>
        {
            if(event.down)
            {
                if(this.outro.visible)
                    this.outro.hide()
                else if(this.intro.visible)
                    this.intro.hide()
                else
                {
                    if(this.fragments.allCaught)
                        this.outro.show()
                    else
                        this.intro.show()
                }
            }
        })

        if(this.game.debug.active)
        {
            this.intro.hide()
        }
    }

    setIntro()
    {
        this.intro = {}
        this.intro.visible = true
        this.intro.element = this.element.querySelector('.intro')
        this.intro.closeElement = this.intro.element.querySelector('.close')

        this.intro.show = () =>
        {
            if(this.intro.visible)
                return

            this.intro.element.classList.add('is-active')
            this.intro.visible = true
        }

        this.intro.hide = () =>
        {
            if(!this.intro.visible)
                return
                
            this.intro.element.classList.remove('is-active')
            this.intro.visible = false
        }

        this.intro.closeElement.addEventListener('click', (event) =>
        {
            event.preventDefault()
            this.intro.hide()
        })
    }

    setOutro()
    {
        this.outro = {}
        this.outro.visible = false
        this.outro.element = this.element.querySelector('.outro')
        this.outro.linkElement = this.outro.element.querySelector('.join')
        this.outro.closeElement = this.outro.element.querySelector('.close')

        this.outro.show = () =>
        {
            if(this.outro.visible)
                return

            this.outro.linkElement.href = this.outro.linkElement.href.replace('XXX', this.fragments.code)
            this.outro.element.classList.add('is-active')
            this.outro.visible = true
        }

        this.outro.hide = () =>
        {
            if(!this.outro.visible)
                return
                
            this.outro.element.classList.remove('is-active')
            this.outro.visible = false
        }

        this.outro.closeElement.addEventListener('click', (event) =>
        {
            event.preventDefault()
            this.outro.hide()
        })
    }

    setFragments()
    {
        this.fragments = {}
        this.fragments.allCaught = false
        this.fragments.catchDistance = 2
        this.fragments.containerElement = this.element.querySelector('.fragments')
        this.fragments.fragmentElements = this.fragments.containerElement.querySelectorAll('.fragment')

        this.fragments.code = 'abc'
        this.fragments.list = [
            { position: new THREE.Vector3(7, 1, 0), character: this.fragments.code[0] },
            { position: new THREE.Vector3(7, 1, 5), character: this.fragments.code[1] },
            { position: new THREE.Vector3(7, 1, 10), character: this.fragments.code[2] },
        ]

        const material = new THREE.MeshBasicNodeMaterial()
        material.color.set(20, 4, 40)
        const geometry = new THREE.IcosahedronGeometry(0.2, 1)

        let i = 0
        for(const _fragment of this.fragments.list)
        {
            _fragment.distance = Infinity
            _fragment.caught = false
            _fragment.element = this.fragments.fragmentElements[i]

            _fragment.object = new FragmentObject(_fragment.position)

            i++
        }

        this.fragments.getClosest = () =>
        {
            let closest = null
            let minDistance = Infinity
            for(const _fragment of this.fragments.list)
            {
                _fragment.distance = _fragment.position.distanceTo(this.game.vehicle.position)

                if(closest === null || _fragment.distance < minDistance)
                {
                    closest = _fragment
                    minDistance = _fragment.distance
                }
            }

            return closest
        }

        this.fragments.tryCatch = (_fragment) =>
        {
            if(_fragment.distance < this.fragments.catchDistance && !_fragment.caught)
                this.fragments.catch(_fragment)
        }

        this.fragments.catch = (_fragment) =>
        {
            _fragment.object.catch()
            _fragment.caught = true
            _fragment.element.innerHTML = /* html */`
                <div class="character">${_fragment.character}</div>
                <div class="bottom"></div>
                <div class="stroke"></div>
                <div class="particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
            `
            requestAnimationFrame(() =>
            {
                _fragment.element.classList.add('is-caught')
            })
            this.fragments.testOver()
        }

        this.fragments.testOver = () =>
        {
            this.fragments.allCaught = this.fragments.list.reduce((accumulator, fragment) => { return fragment.caught && accumulator }, true)

            if(this.fragments.allCaught)
            {
                setTimeout(this.outro.show, 2500)
            }
        }
    }

    update()
    {
        const closest = this.fragments.getClosest()
        this.fragments.tryCatch(closest)
    }
}