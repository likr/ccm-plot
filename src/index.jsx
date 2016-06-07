import React from 'react'
import d3 from 'd3'
import THREE from 'three'
import {render} from 'react-dom'

const correl = (n, x, y) => {
  let xbar = 0
  let ybar = 0
  for (let i = 0; i < n; ++i) {
    xbar += x[i]
    ybar += y[i]
  }
  xbar /= n
  ybar /= n
  let xx = 0
  let xy = 0
  let yy = 0
  for (let i = 0; i < n; ++i) {
    xx += (x[i] - xbar) * (x[i] - xbar)
    xy += (x[i] - xbar) * (y[i] - ybar)
    yy += (y[i] - ybar) * (y[i] - ybar)
  }
  return xy / Math.sqrt(xx * yy)
}

const norm = (n, x, y) => {
  let sum = 0
  for (let i = 0; i < n; ++i) {
    const diff = x[i] - y[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

const weight = (E, xi, i, library) => {
  const values = library
    .map((xj, j) => ({norm: norm(E, xi, xj), index: j}))
    .filter((_, j) => i !== j)
  values.sort((v1, v2) => v1.norm - v2.norm)
  const w = []
  for (let j = 0; j < E + 1; ++j) {
    w.push(values[j])
  }
  let sumw = 0
  w.forEach((_, j) => {
    w[j].weight = Math.exp(-w[j].norm / w[0].norm)
    sumw += w[j].weight
  })
  w.forEach((_, j) => {
    w[j].weight /= sumw
  })
  return w
}

const ccm = (n, X, Y, E, tau, lMin) => {
  const XE = []
  for (let i = (E - 1) * tau; i < n; ++i) {
    const x = []
    for (let j = 0; j < E; ++j) {
      x.push(X[i - tau * j])
    }
    XE.push(x)
  }
  const rho = []
  const Yexact = Y.slice(n - XE.length)
  for (let l = lMin; l < XE.length; ++l) {
    const library = XE.slice(0, l)
    const Yest = []
    XE.forEach((x, i) => {
      const w = weight(E, x, i, library)
      let Yesti = 0
      for (const {weight, index} of w) {
        Yesti += weight * Y[index]
      }
      Yest.push(Yesti)
    })
    rho.push(correl(XE.length, Yexact, Yest))
  }
  return rho
}

const OrbitControls = require('three-orbit-controls')(THREE)
const screenSize = 600

class Screen extends React.Component {
  componentDidMount () {
    const {E, tau, data, camera} = this.props

    const scene = new THREE.Scene()
    camera.position.z = 1

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(screenSize, screenSize)
    this.refs.wrapper.appendChild(renderer.domElement)

    const xScale = d3.scale.linear()
      .domain(d3.extent(data, (d) => +d.X))
      .range([-0.5, 0.5])
    const yScale = d3.scale.linear()
      .domain(d3.extent(data, (d) => +d.Y))
      .range([-0.5, 0.5])
    const xGeometry = new THREE.Geometry()
    const yGeometry = new THREE.Geometry()
    for (let i = tau * 2; i < data.length; ++i) {
      xGeometry.vertices.push(new THREE.Vector3(xScale(data[i].X), xScale(data[i - tau].X), E === 2 ? 0 : xScale(data[i - 2 * tau].X)))
      yGeometry.vertices.push(new THREE.Vector3(yScale(data[i].Y), yScale(data[i - tau].Y), E === 2 ? 0 : yScale(data[i - 2 * tau].Y)))
    }
    scene.add(new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: new THREE.Color(0xff0000)})))
    scene.add(new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: new THREE.Color(0x0000ff)})))

    const controls = new OrbitControls(camera, renderer.domElement)

    const render = () => {
      window.requestAnimationFrame(render)
      controls.update()
      renderer.render(scene, camera)
    }

    render()
  }

  render () {
    const {tau} = this.props
    return <div>
      <p>tau = {tau}</p>
      <div>
        <div ref='wrapper' />
      </div>
    </div>
  }
}

class Chart extends React.Component {
  render () {
    const {data, E, tau} = this.props
    const rhoX = ccm(data.length, data.map((d) => +d.X), data.map((d) => +d.Y), E, tau, 10)
    const rhoY = ccm(data.length, data.map((d) => +d.Y), data.map((d) => +d.X), E, tau, 10)
    const svgSize = 500
    const xScale = d3.scale.linear()
      .domain([0, rhoX.length - 1])
      .range([0, svgSize])
    const yScale = d3.scale.linear()
      .domain([-1, 1])
      .range([svgSize, 0])
    const line = d3.svg.line()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
    return <div>
      <p>tau = {tau}</p>
      <div>
        <svg width={screenSize} height={screenSize} style={{backgroundColor: '#000'}}>
          <g transform='translate(50,50)'>
            <path d={line(rhoX)} fill='none' stroke='#ff0000' />
            <path d={line(rhoY)} fill='none' stroke='#0000ff' />
          </g>
          <g transform='translate(50,300)'>
            <line x1='0' y1='0' x2={svgSize} y2='0' stroke='#fff' />
          </g>
          <g transform='translate(50,50)'>
            <line x1='0' y1='0' x2='0' y2={svgSize} stroke='#fff' />
            <text x='-10' y='0' fill='#fff' textAnchor='end'>1.0</text>
            <text x='-10' y={svgSize * 1 / 4} fill='#fff' textAnchor='end'>0.5</text>
            <text x='-10' y={svgSize / 2} fill='#fff' textAnchor='end'>0.0</text>
            <text x='-10' y={svgSize * 3 / 4} fill='#fff' textAnchor='end'>-0.5</text>
            <text x='-10' y={svgSize} fill='#fff' textAnchor='end'>-1.0</text>
          </g>
          <g transform='translate(60,20)'>
            <text y='0' fill='#ff0000'>M_X -> Y</text>
            <text y='20' fill='#0000ff'>M_Y -> X</text>
          </g>
        </svg>
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
      </div>
      <div style={{display: 'flex'}}>
        <div style={{margin: '0 10px'}}>
          <div>
            <p>E = 2</p>
          </div>
          <div>
            <Chart E={2} tau={1} data={data} />
            <Chart E={2} tau={2} data={data} />
          </div>
        </div>
        <div style={{margin: '0 10px'}}>
          <div>
            <p>E = 3</p>
          </div>
          <div>
            <Chart E={3} tau={1} data={data} />
            <Chart E={3} tau={2} data={data} />
          </div>
        </div>
      </div>
      <div style={{display: 'flex'}}>
        <div style={{margin: '0 10px'}}>
          <div>
            <p>E = 2</p>
          </div>
          <div>
            <Screen E={2} tau={1} data={data} camera={camera} />
            <Screen E={2} tau={2} data={data} camera={camera} />
          </div>
        </div>
        <div style={{margin: '0 10px'}}>
          <div>
            <p>E = 3</p>
          </div>
          <div>
            <Screen E={3} tau={1} data={data} camera={camera} />
            <Screen E={3} tau={2} data={data} camera={camera} />
          </div>
        </div>
      </div>
    </div>
  }
}

d3.csv('data.csv', (data) => {
  render(<App data={data} />, document.getElementById('content'))
})
