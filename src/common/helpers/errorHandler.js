export default function errorHandler(err) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }
}
