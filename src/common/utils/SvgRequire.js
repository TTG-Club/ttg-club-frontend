const req = require.context('@/assets/icons/svg', true, /\.svg$/);

function requireAll(requireContext) {
    return requireContext
        .keys()
        .map(requireContext);
}

requireAll(req);
