
export const useGetLocationId = () => {
    const stored = localStorage.getItem("selectedStore")
    const locationId = stored ? Number(JSON.parse(stored)) : 0
    return { locationId };
}