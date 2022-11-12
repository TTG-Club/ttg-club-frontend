export default function errorHandler(err: any) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }
}
