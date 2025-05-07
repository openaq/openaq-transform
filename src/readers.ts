
// as json, text, blob, response
export const api = async ({ url, as }) => {
    const res = await fetch(url);
    if(as === 'json') {
        return res.json();
    } else if(as === 'text') {
        return res.text();
    } else if(as === 'blob') {
        return res.blob();
    } else if(as === 'response') {
        return res;
    } else {
        return res.json();
    }
};

export const s3 = ({ uri, bucket, key }) => {}
export const google = ({ uri, bucket, key }) => {}
