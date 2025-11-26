import { create } from 'zustand';
import { helloWorld } from '../services/api';

const useHelloStore = create((set) => ({
    serverRespondedHello: false,
    isLoading: false,


    getHello: async (userName) => {
        set({ isLoading: true });

        try {
            const response = await helloWorld(userName);
            console.log(response);
            return response;
        } catch (err) {
            console.error(err);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useHelloStore;
