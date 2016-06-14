/* eslint-env worker */

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

onmessage = (event) => {
  const {n, X, Y, E, tau, lMin} = event.data
  postMessage(ccm(n, X, Y, E, tau, lMin))
}
