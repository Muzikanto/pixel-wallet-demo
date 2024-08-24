const sleep = (time: number) => new Promise(r1 => setTimeout(r1, time));

export async function waitForRequestReady<T>(request: () => Promise<T>) {
    return new Promise(async (resolve: (result: T) => void, reject: (err: Error) => void) => {
        for(let i = 0; i < 3;) {
            if (document.hasFocus()) {
                try {
                    const res = await request();

                    if (res) {
                        return resolve(res);
                    }
                } catch {}
                i++;
                await sleep(3000);
            } else {
                await sleep(100);
            }
        }

        reject(new Error('Connection timeout'));
    });
}