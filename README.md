# car-website
car website
Bu proje, AutoHub araç platformu için Node.js, Express.js ve MySQL kullanılarak geliştirilmiş backend API'sidir.

## Kurulum

1.  **Projeyi Bilgisayarınıza Alın (Klonlama veya İndirme):**

    Bu adım, projenin tüm kod dosyalarını kendi bilgisayarınıza kopyalamak anlamına gelir. İki yaygın yolu vardır:

    * **Yöntem A: Git ile Klonlama (Önerilen Yöntem, eğer proje bir Git deposunda ise):**
        * **Git Nedir?** Git, bir yazılım projesindeki değişiklikleri takip etmeye yarayan bir versiyon kontrol sistemidir. Projenin farklı zamanlardaki hallerini kaydeder.
        * **Git Deposu (Repository) Nedir?** Projenin tüm dosyalarının ve geçmişinin saklandığı yerdir (genellikle GitHub, GitLab gibi platformlarda bulunur).
        * **Ne Gerekli?** Bu yöntemi kullanmak için bilgisayarınızda [Git](https://git-scm.com/downloads) programının kurulu olması gerekir.
        * **Adımlar:**
            1.  Bir komut satırı arayüzü açın (Windows'ta "Komut İstemi" veya "PowerShell", macOS veya Linux'ta "Terminal").
            2.  Proje dosyalarını bilgisayarınızda saklamak istediğiniz bir klasöre gidin. Örneğin:
                ```bash
                cd Belgelerim/Projelerim
                ```
            3.  Aşağıdaki `git clone` komutunu kullanarak projeyi klonlayın. `<repository_url>` kısmını projenin size verilen gerçek Git depo URL'si ile değiştirin:
                ```bash
                git clone <repository_url>
                ```
                Bu komut, depo adıyla (genellikle `autohub-backend` gibi) bir klasör oluşturacak ve tüm proje dosyalarını bu klasörün içine kopyalayacaktır.
            4.  Proje klasörünün içine girin:
                ```bash
                cd autohub-backend
                ```

    * **Yöntem B: Dosyaları ZIP Olarak İndirme (Eğer Git kullanılmıyorsa veya proje size ZIP olarak verildiyse):**
        1.  Proje dosyalarını içeren ZIP dosyasını bilgisayarınıza indirin.
        2.  İndirdiğiniz ZIP dosyasını, projenin bulunmasını istediğiniz bir klasöre çıkartın (extract edin). Bu işlem sonucunda `autohub-backend` (veya benzeri) bir klasör oluşacaktır.
        3.  Bir komut satırı arayüzü açın ve bu `autohub-backend` klasörünün içine girin. Örneğin, dosyaları `Belgelerim/Projelerim/autohub-backend` içine çıkardıysanız, komut satırına şunu yazarsınız:
            ```bash
            cd Belgelerim/Projelerim/autohub-backend
            ```

    **Bu adımın sonunda, `autohub-backend` adlı proje klasörünün içinde olmalısınız.**

2.  **Proje Bağımlılıklarını Yükleyin:**

    Bu backend projesinin düzgün çalışabilmesi için bazı ek yazılım paketlerine (kütüphanelere) ihtiyacı vardır. Bu paketlere "bağımlılık" denir.

    * **Ne Gerekli?** Bu adımı gerçekleştirmek için bilgisayarınızda [Node.js](https://nodejs.org/) programının kurulu olması gerekir. Node.js'i yüklediğinizde, `npm` (Node Package Manager - Node Paket Yöneticisi) adlı bir araç da otomatik olarak yüklenir. `npm`, bu bağımlılıkları yönetmek için kullanılır.
    * **Adımlar:**
        1.  **Proje ana dizininde olduğunuzdan emin olun.** (Bir önceki adımda komut satırında `autohub-backend` klasörünün içine girmiştiniz).
        2.  Aşağıdaki komutu komut satırında çalıştırın:
            ```bash
            npm install
            ```
            Bu komut, proje klasöründe bulunan `package.json` adlı bir dosyayı okur. Bu dosya, projenin ihtiyaç duyduğu tüm bağımlılıkların bir listesini içerir. `npm install` komutu, bu listedeki tüm paketleri internetten indirir ve projenizin içinde `node_modules` adında bir klasöre kurar. Bu işlem, internet bağlantı hızınıza ve projedeki bağımlılık sayısına bağlı olarak birkaç dakika sürebilir.

    **Bu adımın sonunda, projenin çalışması için gerekli tüm ek yazılımlar bilgisayarınıza yüklenmiş olacaktır.**

3.  **Ortam Değişkenlerini Ayarlayın:**
    Proje ana dizininde `.env` adında bir dosya oluşturun. `.env.example` (eğer varsa) veya aşağıdaki şablonu kullanabilirsiniz:
    ```plaintext
    # Sunucu Ayarları
    PORT=3001

    # MySQL Veritabanı Bağlantı Bilgileri
    DB_HOST=localhost
    DB_USER=your_mysql_user # Örneğin: root
    DB_PASSWORD=your_mysql_password
    DB_NAME=autohub_db
    DB_PORT=3306

    # JSON Web Token (JWT) Ayarları
    JWT_SECRET=your_very_strong_and_long_jwt_secret_key_at_least_32_characters
    JWT_EXPIRES_IN=1d
    ```
    **ÖNEMLİ:** `your_mysql_user`, `your_mysql_password` ve `JWT_SECRET` kısımlarını kendi bilgilerinizle değiştirin. `JWT_SECRET` için güçlü ve rastgele bir dize kullanın.

4.  **MySQL Veritabanını ve Tabloları Oluşturun:**
    MySQL sunucunuzda `autohub_db` (veya `.env` dosyasında belirttiğiniz başka bir isim) adında bir veritabanı oluşturun. Ardından aşağıdaki SQL komutlarını kullanarak tabloları oluşturun:

    ```sql
    CREATE DATABASE IF NOT EXISTS autohub_db;
    USE autohub_db;

    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS cars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(2048),
        added_by_user_id INT, -- Arabayı ekleyen admin kullanıcısının ID'si (opsiyonel)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL -- Admin silinirse araba kalır
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        car_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (user_id, car_id), -- Bir kullanıcı bir arabayı sadece bir kez favorileyebilir
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Kullanıcı silinirse favorileri de silinir
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE -- Araba silinirse favorilerden de silinir
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        car_id INT NOT NULL,
        purchase_price DECIMAL(10, 2) NOT NULL, -- Satın alma anındaki fiyat
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Kullanıcı silinirse satın almaları da silinir
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE -- Araba silinirse satın alma kayıtları da silinir
        -- Eğer araba silindiğinde satın alma kaydının kalması isteniyorsa ON DELETE SET NULL veya ON DELETE RESTRICT kullanılabilir.
        -- Bu örnekte CASCADE kullanıldı, yani araba silinirse ilişkili satın alma da silinir.
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Örnek bir admin kullanıcı ekleyebilirsiniz (şifre: admin123)
    -- Gerçek uygulamada daha güvenli bir şifre kullanın ve bu adımı manuel olarak veya bir script ile yapın.
    -- Şifre: 'admin123' -> bcrypt ile hashlenmiş hali (bu hash'i kendi bcrypt'inizle üretmeniz daha doğru olur)
    -- Örnek hash (bcryptjs.hashSync('admin123', 10)): $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (kendiniz üretin)
    -- INSERT INTO users (username, email, password, is_admin) VALUES ('admin', 'admin@autohub.com', '$2a$10$YOUR_GENERATED_BCRYPT_HASH_FOR_admin123', TRUE);

    ```

5.  **Sunucuyu Başlatın:**
    * Geliştirme modu (nodemon ile otomatik yeniden başlatma):
        ```bash
        npm run dev
        ```
    * Production modu:
        ```bash
        npm start
        ```

    Sunucu varsayılan olarak `http://localhost:3001` adresinde çalışacaktır.

## API Endpoint'leri

Frontend (`script.js`) dosyanızın beklediği API endpoint'leri şunlardır:

* **Authentication (`/api/auth`)**
    * `POST /register`: `{ username, email, password }`
    * `POST /login`: `{ emailOrUsername, password }`
* **User Actions (`/api/user`)** (Kimlik Doğrulama Gerektirir)
    * `GET /profile`
    * `GET /favorites`
 C:\Users\Muhammed Yahya\OneDrive - 29mayis\Belgeler\GitHub\Carwebsite
