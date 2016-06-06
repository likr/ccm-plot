import React from 'react'
import d3 from 'd3'
import THREE from 'three'
import {render} from 'react-dom'

const OrbitControls = require('three-orbit-controls')(THREE)
const screenSize = 600

class Screen extends React.Component {
  componentDidMount () {
    const {n, tau, data, camera} = this.props

    const xScene = new THREE.Scene()
    const yScene = new THREE.Scene()
    camera.position.z = 1

    const xRenderer = new THREE.WebGLRenderer()
    xRenderer.setSize(screenSize, screenSize)
    this.refs.xWrapper.appendChild(xRenderer.domElement)

    const yRenderer = new THREE.WebGLRenderer()
    yRenderer.setSize(screenSize, screenSize)
    this.refs.yWrapper.appendChild(yRenderer.domElement)

    const color = d3.scale.category20()
    data.forEach((item, j) => {
      const xGeometry = new THREE.Geometry()
      const yGeometry = new THREE.Geometry()
      const material = new THREE.LineBasicMaterial({color: new THREE.Color(color(j))})
      for (let i = 0; i < n - tau * 2; ++i) {
        xGeometry.vertices.push(new THREE.Vector3(item[`x${i}`] - 0.5, item[`x${i + tau}`] - 0.5, item[`x${i + 2 * tau}`] - 0.5))
        yGeometry.vertices.push(new THREE.Vector3(item[`y${i}`] - 0.5, item[`y${i + tau}`] - 0.5, item[`y${i + 2 * tau}`] - 0.5))
      }
      xScene.add(new THREE.Line(xGeometry, material))
      yScene.add(new THREE.Line(yGeometry, material))
    })

    const xControls = new OrbitControls(camera, xRenderer.domElement)
    const yControls = new OrbitControls(camera, yRenderer.domElement)

    const render = () => {
      window.requestAnimationFrame(render)
      xControls.update()
      yControls.update()
      xRenderer.render(xScene, camera)
      yRenderer.render(yScene, camera)
    }

    render()
  }

  render () {
    const {tau} = this.props
    return <div>
      <p>tau = {tau}</p>
      <div style={{display: 'flex'}}>
        <div style={{margin: '0 10px'}}ref='xWrapper' />
        <div style={{margin: '0 10px'}}ref='yWrapper' />
      </div>
    </div>
  }
}

class App extends React.Component {
  render () {
    const {n, data} = this.props
    // const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000)
    return <div>
      <div>
        <p>n = {data.length}</p>
        <p>T_max = {n}</p>
        <p>E = 3</p>
      </div>
      <div>
        <Screen n={n} tau={1} data={data} camera={camera} />
        <Screen n={n} tau={2} data={data} camera={camera} />
        <Screen n={n} tau={3} data={data} camera={camera} />
        <Screen n={n} tau={4} data={data} camera={camera} />
      </div>
    </div>
  }
}

d3.csv('data.csv', (data) => {
  render(<App n={100} data={data} />, document.getElementById('content'))
})
