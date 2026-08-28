// Deprecated: VerifikasiBerkas now receives real database records directly from Inertia props.
export function useDocumentStore() {
    return [[], () => {}] as const;
}
