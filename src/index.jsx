import React from 'react'
import d3 from 'd3'
import THREE from 'three'
import {render} from 'react-dom'

const OrbitControls = require('three-orbit-controls')(THREE)
const screenSize = 600

class Screen extends React.Component {
  componentDidMount () {
    const {tau, data, camera} = this.props

    const xScene = new THREE.Scene()
    const yScene = new THREE.Scene()
    camera.position.z = 1

    const xRenderer = new THREE.WebGLRenderer()
    xRenderer.setSize(screenSize, screenSize)
    this.refs.xWrapper.appendChild(xRenderer.domElement)

    const yRenderer = new THREE.WebGLRenderer()
    yRenderer.setSize(screenSize, screenSize)
    this.refs.yWrapper.appendChild(yRenderer.domElement)

    const xScale = d3.scale.linear()
      .domain(d3.extent(data, (d) => +d.X))
      .range([-0.5, 0.5])
    const yScale = d3.scale.linear()
      .domain(d3.extent(data, (d) => +d.Y))
      .range([-0.5, 0.5])
    const xGeometry = new THREE.Geometry()
    const yGeometry = new THREE.Geometry()
    for (let i = tau * 2; i < data.length; ++i) {
      xGeometry.vertices.push(new THREE.Vector3(xScale(data[i].X), xScale(data[i - tau].X), xScale(data[i - 2 * tau].X)))
      yGeometry.vertices.push(new THREE.Vector3(yScale(data[i].Y), yScale(data[i - tau].Y), yScale(data[i - 2 * tau].Y)))
    }
    xScene.add(new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: new THREE.Color(0xff0000)})))
    yScene.add(new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: new THREE.Color(0x0000ff)})))

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
    const {data} = this.props
    // const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000)
    return <div>
      <div>
        <p>n = {data.length}</p>
        <p>E = 3</p>
      </div>
      <div>
        <Screen tau={1} data={data} camera={camera} />
        <Screen tau={2} data={data} camera={camera} />
        <Screen tau={3} data={data} camera={camera} />
        <Screen tau={4} data={data} camera={camera} />
      </div>
    </div>
  }
}

d3.csv('data.csv', (data) => {
  render(<App data={data} />, document.getElementById('content'))
})
