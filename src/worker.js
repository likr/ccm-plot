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
  quickselect(library, E + 1, null, null, (j1, j2) => matrix[i][j1] - matrix[i][j2])
  const w = new Array(E)
  for (let k = 0; k < E + 1; ++k) {
    const j = library[k]
    w[k] = {norm: matrix[i][j], index: j}
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

const ccm = (n, X, Y, E, tau, lMin, step, repeatMax) => {
  const delta = (E - 1) * tau
  const m = n - delta
  const XE = new Array(m)
  for (let i = delta; i < n; ++i) {
    const x = new Array(E)
    for (let j = 0; j < E; ++j) {
      x[j] = X[i - tau * j]
    }
    XE[i - delta] = x
  }
  const matrix = normMatrix(E, XE)
  const rho = []
  const Yexact = Y.slice(n - m)
  for (let l = lMin; l < m; l += step) {
    let rhoAvg = 0
    for (let repeat = 0; repeat < repeatMax; ++repeat) {
      const library = new Array(l)
      for (let i = 0; i < l; ++i) {
        library[i] = Math.floor(Math.random() * m)
      }
      const Yest = XE.map((x, i) => {
        const w = weight(E, x, i, library, matrix)
        let Yesti = 0
        for (const {weight, index} of w) {
          Yesti += weight * Y[index]
        }
        return Yesti
      })
      rhoAvg += correl(m, Yexact, Yest)
    }
    rhoAvg /= repeatMax
    rho.push([l, rhoAvg])
  }
  return rho
}

onmessage = (event) => {
  const {n, X, Y, E, tau, lMin, lStep, repeatMax} = event.data
  const result = ccm(n, X, Y, E, tau, lMin, lStep, repeatMax)
  postMessage(result)
}
