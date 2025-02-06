import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminPanel = () => {
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [photosModalOpen, setPhotosModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newProducent, setNewProducent] = useState('');
	const [newOpis, setNewOpis] = useState('');
	const [newCena, setNewCena] = useState('');
    // State dla edycji produktu
    const [name, setName] = useState('');
    const [producent, setProducent] = useState('');
    const [opis, setOpis] = useState('');
    const [cena, setCena] = useState('');

    // State dla zdjęć
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/user-data", { withCredentials: true });
                if (response.data.user.isAdmin) {
                    setUser(response.data.user);
                } else {
                    window.location.href = "/";
                }
            } catch (error) {
                window.location.href = "/login";
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/products", { withCredentials: true });
                setProducts(response.data);
            } catch (error) {
                console.error("Błąd podczas pobierania produktów", error);
            }
        };
        fetchProducts();
    }, []);

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setName(product.name);
        setProducent(product.producent);
        setOpis(product.opis);
        setCena(product.cena);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setSelectedProduct(null);
    };

    const openPhotosModal = (product) => {
        setSelectedProduct(product);
        setPhotosModalOpen(true);
    };

    const closePhotosModal = () => {
        setPhotosModalOpen(false);
        setSelectedProduct(null);
    };
const openAddModal = () => {
    setAddModalOpen(true);
};

const closeAddModal = () => {
    setAddModalOpen(false);
    setNewName('');
    setNewProducent('');
    setNewOpis('');
    setNewCena('');
};
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            const updatedProduct = { name, producent, opis, cena };

            await axios.put(`http://localhost:5000/products/${selectedProduct.id}`, updatedProduct, { withCredentials: true });

            setProducts((prev) =>
                prev.map((prod) =>
                    prod.id === selectedProduct.id ? { ...prod, ...updatedProduct } : prod
                )
            );

            closeEditModal();
        } catch (error) {
            console.error("Błąd przy zapisywaniu zmian", error);
        }
    };

    const handleDeletePhoto = async (photoIndex) => {
        try {
            await axios.post(
                `http://localhost:5000/delete-photo/${selectedProduct.id}`,
                { photoIndex },
                { withCredentials: true }
            );

            setSelectedProduct((prev) => {
                const updatedPhotos = JSON.parse(prev.photos);
                updatedPhotos.photos.splice(photoIndex, 1);
                return { ...prev, photos: JSON.stringify(updatedPhotos) };
            });

            setProducts((prev) =>
                prev.map((prod) =>
                    prod.id === selectedProduct.id
                        ? { ...prod, photos: selectedProduct.photos }
                        : prod
                )
            );
        } catch (error) {
            console.error("Błąd przy usuwaniu zdjęcia", error);
        }
    };

    const handleUploadPhotos = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }
        formData.append("productId", selectedProduct.id);

        try {
            const response = await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });

            if (response.status === 200) {
                alert("Zdjęcia zostały dodane!");
                setFiles([]);
                setSelectedProduct((prev) => {
                    const updatedPhotos = JSON.parse(prev.photos);
                    updatedPhotos.photos = updatedPhotos.photos.concat(response.data.newPhotos);
                    return { ...prev, photos: JSON.stringify(updatedPhotos) };
                });
            }
        } catch (error) {
            console.error("Błąd przy dodawaniu zdjęć", error);
        }
    };
	const [orders, setOrders] = useState([]);

useEffect(() => {
    const fetchOrders = async () => {
        try {
            const response = await axios.get("http://localhost:5000/orders", { withCredentials: true });
            setOrders(response.data);
        } catch (error) {
            console.error("Błąd podczas pobierania zamówień", error);
        }
    };
    fetchOrders();
}, []);

const markAsCompleted = async (orderId) => {
    try {
        await axios.put(`http://localhost:5000/orders/${orderId}/status`, {}, { withCredentials: true });

        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId ? { ...order, status: "zrealizowane" } : order
            )
        );
    } catch (error) {
        console.error("Błąd przy zmianie statusu zamówienia", error);
    }
};

const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
        const newProduct = { name: newName, producent: newProducent, opis: newOpis, cena: newCena };

        const response = await axios.post("http://localhost:5000/products", newProduct, { withCredentials: true });

        if (response.status === 201) {
            setProducts([...products, response.data]);
            setNewName("");
            setNewProducent("");
            setNewOpis("");
            setNewCena("");
            closeAddModal();
        }
    } catch (error) {
        console.error("Błąd przy dodawaniu produktu", error);
    }
};
const renderOrderData = (orderData) => {
    try {
        const parsedData = JSON.parse(orderData); // Parsowanie danych z JSON
        console.log(parsedData); // Wypisanie danych zamówienia w konsoli

        // Sprawdzamy, czy dane są tablicą
        if (Array.isArray(parsedData)) {
            return (
                <div>
                    {parsedData.map((item, index) => (
                        <div key={index}>
                            <p>Produkt: {item.name}</p>
                            <p>ID: {item.id}</p>
                            <p>{parsedData.quantity}</p>
                        </div>
                    ))}
                </div>
            );
        }

        // Jeśli dane nie są tablicą, wyświetlamy je jak wcześniej
        return (
            <div>
                <p>Produkt: {parsedData.name}</p>
                <p>ID: {parsedData.id}</p>
                <p>{parsedData.quantity}</p>
            </div>
        );
    } catch (error) {
        return <p>Błąd przy parsowaniu danych</p>;
    }
};

return (
    <>
        <div>
            <h2>Admin Panel</h2>
            <p>Welcome, {user?.email}!</p>

            <h3>Lista produktów</h3>
            <button onClick={openAddModal}>Dodaj nowy produkt</button>

            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nazwa</th>
                        <th>Cena</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>{product.cena} zł</td>
                            <td>
                                <button onClick={() => openEditModal(product)}>Edytuj</button>
                                <button onClick={() => openPhotosModal(product)}>Pokaż zdjęcia</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal edycji produktu */}
            {editModalOpen && selectedProduct && (
                <div className="modal" style={modalStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h2>Edytuj produkt</h2>
                        <form onSubmit={handleSaveChanges}>
                            <label>Nazwa:</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                            <label>Cena:</label>
                            <input type="number" value={cena} onChange={(e) => setCena(e.target.value)} />
                            <label>Opis:</label>
                            <textarea value={opis} onChange={(e) => setOpis(e.target.value)} />
                            <label>Producent:</label>
                            <input type="text" value={producent} onChange={(e) => setProducent(e.target.value)} />
                            <button type="submit">Zapisz zmiany</button>
                        </form>
                        <button onClick={closeEditModal}>Zamknij</button>
                    </div>
                </div>
            )}

            {addModalOpen && (
                <div className="modal" style={modalStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h2>Dodaj produkt</h2>
                        <form onSubmit={handleAddProduct}>
                            <div>
                                <label>Nazwa:</label>
                                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label>Cena:</label>
                                <input type="number" value={newCena} onChange={(e) => setNewCena(e.target.value)} />
                            </div>
                            <div>
                                <label>Opis:</label>
                                <textarea value={newOpis} onChange={(e) => setNewOpis(e.target.value)} />
                            </div>
                            <div>
                                <label>Producent:</label>
                                <input type="text" value={newProducent} onChange={(e) => setNewProducent(e.target.value)} />
                            </div>
                            <button type="submit">Dodaj produkt</button>
                        </form>
                        <button onClick={closeAddModal}>Zamknij</button>
                    </div>
                </div>
            )}

            {/* Modal zdjęć */}
            {photosModalOpen && selectedProduct && (
                <div className="modal" style={modalStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h2>Zdjęcia produktu</h2>
                        {Array.isArray(JSON.parse(selectedProduct.photos)?.photos) &&
                            JSON.parse(selectedProduct.photos)?.photos.map((image, index) => (
                                <div key={index} style={{ marginBottom: "10px" }}>
                                    <img src={image} alt={`Zdjęcie ${index}`} style={{ width: "100%" }} />
                                    <button onClick={() => handleDeletePhoto(index)}>Usuń</button>
                                </div>
                            ))}

                        <h3>Dodaj zdjęcia</h3>
                        <form onSubmit={handleUploadPhotos}>
                            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
                            <button type="submit">Prześlij</button>
                        </form>

                        <button onClick={closePhotosModal}>Zamknij</button>
                    </div>
                </div>
            )}
        </div>

        {/* Sekcja zamówień */}
<div>
            <h3>Lista zamówień</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Użytkownik</th>
                        <th>Dane</th>
                        <th>Status</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr
                            key={order.id}
                            style={{ backgroundColor: order.status === "niezrealizowane" ? "red" : "white" }}
                        >
                            <td>{order.id}</td>
                            <td>{order.user_id}</td>
                            {/* Wyświetlenie danych zamówienia */}
                            <td>{renderOrderData(order.data)}</td>
                            <td>{order.status}</td>
                            <td>
                                {order.status === "niezrealizowane" && (
                                    <button onClick={() => markAsCompleted(order.id)}>
                                        Oznacz jako zrealizowane
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </>
);
}
const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const modalContentStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "500px",
    textAlign: "center",
    overflowY: "auto",
    maxHeight: "80vh",
};
export default AdminPanel;
