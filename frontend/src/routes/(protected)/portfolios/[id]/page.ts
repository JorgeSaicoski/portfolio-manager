export const load = ({ params }: { params: { id: string } }) => {
    const id = parseInt(params.id, 10);
    
    // Validate that it's a valid number
    if (isNaN(id)) {
        throw new Error('Invalid portfolio ID');
    }
    
    return {
        id: id  // Now this is a number, not a string
    };
};