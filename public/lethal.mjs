//////////////////////////////
///          Init          ///
//////////////////////////////
import * as BareMux from "https://unpkg.com/@mercuryworkshop/bare-mux@2.1.7/dist/index.mjs"

//////////////////////////////
///         Options        ///
//////////////////////////////
const connection = new BareMux.BareMuxConnection("/bareworker.js")

let wispURL = null
let transportURL = null
let proxyOption = null

const transportOptions = {
  epoxy:
    "https://unpkg.com/@mercuryworkshop/epoxy-transport@2.1.27/dist/index.mjs",
  libcurl:
    "https://unpkg.com/@mercuryworkshop/libcurl-transport@1.5.0/dist/index.mjs",
}

let scramjet;

//////////////////////////////
///           SW           ///
//////////////////////////////
const stockSW = "./ultraworker.js"
const swAllowedHostnames = ["localhost", "127.0.0.1"]

async function registerSW() {
  await import("/scram/scramjet.all.js");
  const { ScramjetController } = window.$scramjetLoadController();

  scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js",
    },
    flags: {
      rewriterLogs: false,
      naiiveRewriter: false,
      scramitize: false,
    },
    siteFlags: {
      "https://www.google.com/(search|sorry).*": {
        naiiveRewriter: true,
      },
    },
  });

  scramjet.init();

  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.")

    throw new Error("Your browser doesn't support service workers.")
  }

  await navigator.serviceWorker.register(stockSW)
}

await registerSW()
console.log("lethal.js: Service Worker registered")

//////////////////////////////
///        Functions       ///
//////////////////////////////
export function makeURL(
  input,
  template = "https://search.brave.com/search?q=%s",
) {
  try {
    return new URL(input).toString()
  } catch (err) { }

  const url = new URL(`http://${input}`)
  if (url.hostname.includes(".")) return url.toString()

  return template.replace("%s", encodeURIComponent(input))
}

async function updateBareMux() {
  if (transportURL != null && wispURL != null) {
    console.log(
      `lethal.js: Setting BareMux to ${transportURL} and Wisp to ${wispURL}`,
    )
    await connection.setTransport(transportURL, [{ wisp: wispURL }])
  }
}

export async function setTransport(transport) {
  console.log(`lethal.js: Setting transport to ${transport}`)
  transportURL = transportOptions[transport]
  if (!transportURL) {
    transportURL = transport
  }

  await updateBareMux()
}

export function getTransport() {
  return transportURL
}

export async function setWisp(wisp) {
  console.log(`lethal.js: Setting Wisp to ${wisp}`)
  wispURL = wisp

  await updateBareMux()
}

export function getWisp() {
  return wispURL
}

export async function setProxy(proxy) {
  console.log(`lethal.js: Setting proxy backend to ${proxy}`)
  if (proxy === "uv") {
    await import(
      "https://unpkg.com/@titaniumnetwork-dev/ultraviolet@3.2.10/dist/uv.bundle.js"
    )

    await import("./uv.config.js")
  }
  proxyOption = proxy
}

export function getProxy() {
  return proxyOption
}

export async function getProxied(input) {
  const url = makeURL(input)

  if (proxyOption === "scramjet") return scramjet.encodeUrl(url)

  return __uv$config.prefix + __uv$config.encodeUrl(url)
}
