export const load = ({ params }: { params: { id: string } }) => {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
        throw new Error('Invalid category ID');
    }

    return {
        id: id
    };
};
