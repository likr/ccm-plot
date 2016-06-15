/* eslint-env worker */
import quickselect from 'quickselect'

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

const normMatrix = (E, XE) => {
  const n = XE.length
  const matrix = new Array(n)
  for (let i = 0; i < n; ++i) {
    const row = new Array(n)
    for (let j = 0; j < n; ++j) {
      row[j] = norm(E, XE[i], XE[j]) || 1e-8
    }
    matrix[i] = row
  }
  return matrix
}

const weight = (E, xi, i, library, matrix) => {
  const values = library.map((j) => ({norm: matrix[i][j], index: j}))
  quickselect(values, E + 1, null, null, (v1, v2) => v1.norm - v2.norm)
  const w = []
  for (let j = 0; j < E + 1; ++j) {
    w.push(values[j])
  }
  quickselect(w, 1, null, null, (v1, v2) => v1.norm - v2.norm)
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

const ccm = (n, X, Y, E, tau, lMin, step) => {
  const XE = []
  for (let i = (E - 1) * tau; i < n; ++i) {
    const x = []
    for (let j = 0; j < E; ++j) {
      x.push(X[i - tau * j])
    }
    XE.push(x)
  }
  const m = XE.length
  const matrix = normMatrix(E, XE)
  const rho = []
  const Yexact = Y.slice(n - m)
  for (let l = lMin; l < m; l += step) {
    const library = new Array(l)
    for (let i = 0; i < l; ++i) {
      library[i] = Math.floor(Math.random() * m)
    }
    const Yest = []
    XE.forEach((x, i) => {
      const w = weight(E, x, i, library, matrix)
      let Yesti = 0
      for (const {weight, index} of w) {
        Yesti += weight * Y[index]
      }
      Yest.push(Yesti)
    })
    rho.push([l, correl(m, Yexact, Yest)])
  }
  return rho
}

onmessage = (event) => {
  const {n, X, Y, E, tau, lMin, lStep} = event.data
  const timeId = `ccm${Math.random()}`
  console.time(timeId)
  const result = ccm(n, X, Y, E, tau, lMin, lStep)
  console.timeEnd(timeId)
  postMessage(result)
}
