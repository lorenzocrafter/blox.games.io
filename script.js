function seleccionarJuego(nombre) {
    alert("Has seleccionado: " + nombre);
}

// Esto hace que los botones cambien de color
const botones = document.querySelectorAll('.btn');
botones.forEach(boton => {
    boton.addEventListener('click', function() {
        botones.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});
