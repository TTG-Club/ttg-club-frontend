export {};

const req = require.context('@/assets/icons/svg', true, /\.svg$/);

function requireAll(requireContext: __WebpackModuleApi.RequireContext) {
    return requireContext
        .keys()
        .map(requireContext);
}

requireAll(req);
