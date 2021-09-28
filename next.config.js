const withRpc = require('next-rpc')({
    experimentalContext: true,
})
/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
}
module.exports = withRpc(config)
