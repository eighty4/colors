import {initializeApp} from 'firebase/app'
import {
    addDoc,
    collection,
    connectFirestoreEmulator,
    deleteDoc,
    getDocs,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore'
import {browser} from '$app/environment'

export interface PaletteRecord {
    id: string
    name?: string
    colors: Array<string>
}

const app = initializeApp({
    apiKey: 'AIzaSyA-0JD_rckbTo4JD0ngjuuOKFskNpOk4Bs',
    authDomain: 'eighty4-colors.firebaseapp.com',
    projectId: 'eighty4-colors',
    storageBucket: 'eighty4-colors.appspot.com',
    messagingSenderId: '5174695501',
    appId: '1:5174695501:web:9e802fda3f3c3dfd206e04',
    measurementId: 'G-3F45TG1T78',
})

const dev = true

try {
    initializeFirestore(app, {
        localCache:
            persistentLocalCache({tabManager: persistentMultipleTabManager()}),
    })
} catch (e: any) {
    if (dev && e.code === 'failed-precondition') {
        console.log('initializeFirestore error', e.code, e.name, Object.keys(e))
    } else {
        throw e
    }
}
const db = getFirestore()
if (dev && !(db as any)._settingsFrozen) {
    connectFirestoreEmulator(db, '127.0.0.1', 5002)
}

export async function addPalette(palette: Partial<PaletteRecord>): Promise<PaletteRecord> {
    if (!palette.name) {
        throw new Error('palette name is required')
    }
    if (!palette.colors) {
        throw new Error('palette colors is required')
    }
    const record = await addDoc(collection(db, 'palettes'), {
        name: palette.name,
        colors: palette.colors,
    })
    palette.id = record.id
    return palette as PaletteRecord
}

export async function getPalettes(): Promise<Array<PaletteRecord>> {
    const querySnapshot = await getDocs(collection(db, 'palettes'))
    const palettes: Array<PaletteRecord> = []
    querySnapshot.forEach((doc) => {
        const {name, colors} = doc.data()
        palettes.push({
            id: doc.id,
            name,
            colors,
        })
    })
    return palettes
}

if (browser) {
    (window as any).clearPalettes = async () => {
        (await getDocs(collection(db, 'palettes'))).forEach((doc) => {
            deleteDoc(doc.ref).then(() => console.log('deleted', doc.id))
        })
    }
}
