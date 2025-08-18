// Espera a que todo el contenido del DOM esté cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // MÓDULO DE NAVEGACIÓN (MENÚ MÓVIL Y HEADER)
    // =========================================================================
    const mobileMenuPanel = document.getElementById('mobile-menu-panel');
    const menuOverlay = document.getElementById('menu-overlay');

    // Función para abrir el menú móvil
    function openMenu() {
        if (mobileMenuPanel) mobileMenuPanel.classList.add('is-open');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evita el scroll del fondo
    }

    // Función para cerrar el menú móvil
    function closeMenu() {
        if (mobileMenuPanel) mobileMenuPanel.classList.remove('is-open');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaura el scroll
    }

    // Listener global para acciones de menú (más eficiente que múltiples listeners)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.getAttribute('data-action');
        if (action === 'open-menu') openMenu();
        if (action === 'close-menu') closeMenu();
    });

    // Cierra el menú al hacer clic en un enlace dentro de él
    if (mobileMenuPanel) {
        mobileMenuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Lógica para el header que aparece al hacer scroll
    window.addEventListener('scroll', () => {
        // Añade o quita la clase 'scrolled' al body si el scroll es mayor a 50px
        document.body.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true }); // Mejora de rendimiento: indica que el listener no cancelará el scroll

    // =========================================================================
    // MÓDULO DE EFECTOS VISUALES
    // =========================================================================

    // --- Efecto de Estela del Cursor (Solo para dispositivos no táctiles) ---
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
        const trailContainer = document.body;
        const dots = [];
        for (let i = 0; i < 20; i++) {
            const dot = document.createElement('div');
            dot.classList.add('trail');
            trailContainer.appendChild(dot);
            dots.push({ el: dot, x: 0, y: 0 });
        }

        let mousePos = { x: -100, y: -100 };
        window.addEventListener('mousemove', (e) => {
            mousePos = { x: e.clientX, y: e.clientY };
        });

        let hue = 0;
        function animateTrail() {
            hue = (hue + 1) % 360;
            let currentX = mousePos.x;
            let currentY = mousePos.y;

            const styles = getComputedStyle(document.documentElement);
            const saturation = styles.getPropertyValue('--trail-saturation').trim();
            const lightness = styles.getPropertyValue('--trail-lightness').trim();
            const alpha = parseFloat(styles.getPropertyValue('--trail-alpha').trim());

            dots.forEach((dot, index) => {
                const nextDot = dots[index + 1] || dots[0];
                dot.x = currentX;
                dot.y = currentY;
                dot.el.style.left = dot.x + 'px';
                dot.el.style.top = dot.y + 'px';
                dot.el.style.backgroundColor = `hsla(${hue + index * 10}, ${saturation}, ${lightness}, ${alpha * (1 - index / dots.length)})`;
                currentX += (nextDot.x - dot.x) * 0.6;
                currentY += (nextDot.y - dot.y) * 0.6;
            });
            requestAnimationFrame(animateTrail);
        }
        animateTrail();
    }

    // --- Interacción con Bordes de Tarjetas ---
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const setGlowPosition = (x, y) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', `${x - rect.left}px`);
            card.style.setProperty('--y', `${y - rect.top}px`);
        };

        card.addEventListener('mousemove', (e) => setGlowPosition(e.clientX, e.clientY));

        if (!isTouchDevice) {
            card.addEventListener('mouseenter', () => {
                document.querySelectorAll('.trail').forEach(t => t.style.opacity = '0');
            });
            card.addEventListener('mouseleave', () => {
                document.querySelectorAll('.trail').forEach(t => t.style.opacity = '1');
            });
        }

        card.addEventListener('touchstart', (e) => {
            card.classList.add('touch-active');
            setGlowPosition(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchmove', (e) => {
            setGlowPosition(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchend', () => card.classList.remove('touch-active'));
        card.addEventListener('touchcancel', () => card.classList.remove('touch-active'));
    });

    // --- Lógica del Tema (Claro/Oscuro) ---
    const themeToggleBtns = document.querySelectorAll('.theme-toggle');
    const htmlEl = document.documentElement;

    function applyTheme(theme) {
        htmlEl.classList.toggle('dark', theme === 'dark');
        themeToggleBtns.forEach(btn => {
            btn.querySelector('.sun-icon').classList.toggle('hidden', theme === 'dark');
            btn.querySelector('.moon-icon').classList.toggle('hidden', theme !== 'dark');
        });
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newTheme = htmlEl.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    });

    // --- Efecto de Escritura (Typewriter) ---
    class Typewriter {
        constructor(element, texts, options = {}) {
            this.element = element;
            this.texts = texts;
            this.loop = options.loop || false;
            this.typeSpeed = options.typeSpeed || 60;
            this.deleteSpeed = options.deleteSpeed || 30;
            this.pause = options.pause || 2000;
            this.textIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
            this.element.innerHTML = `<span></span>`;
            this.textSpan = this.element.querySelector('span');
            this.tick();
        }

        tick() {
            const currentText = this.texts[this.textIndex];
            let timeout = this.typeSpeed;

            if (this.isDeleting) {
                this.charIndex--;
                timeout = this.deleteSpeed;
            } else {
                this.charIndex++;
            }

            this.textSpan.innerHTML = currentText.substring(0, this.charIndex);

            if (!this.isDeleting && this.charIndex === currentText.length) {
                timeout = this.pause;
                if (this.loop) {
                    this.isDeleting = true;
                }
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                timeout = 150;
            }

            setTimeout(() => this.tick(), timeout);
        }
    }

    const typingTitleEl = document.getElementById('typing-title');
    if (typingTitleEl) {
        new Typewriter(typingTitleEl, [
            'Aprende a Programar<span class="text-blue-500"> desde Cero</span>',
            'Construye Proyectos<span class="text-blue-500"> Reales</span>',
            'Inicia tu Carrera en<span class="text-blue-500"> Tecnología</span>'
        ], {
            loop: true,
            typeSpeed: 40,
            deleteSpeed: 25,
            pause: 1500
        });
    }

    const projectTitleEl = document.getElementById('project-title');
    if (projectTitleEl) {
        new Typewriter(projectTitleEl, ['Módulo 7: Primeros Pasos en un<span class="text-blue-500"> Proyecto Real</span>'], {
            loop: true,
            typeSpeed: 40,
            deleteSpeed: 25,
            pause: 2500
        });
    }

    // =========================================================================
    // MÓDULO DE COMPONENTES INTERACTIVOS
    // =========================================================================

    // --- Carrusel de Testimonios ---
    const testimonialsContainer = document.getElementById('testimonials-container');
    const prevTestimonialBtn = document.getElementById('prev-testimonial');
    const nextTestimonialBtn = document.getElementById('next-testimonial');
    let autoScrollInterval;
    let currentIndex = 0;

    function updateCarousel() {
        if (!testimonialsContainer) return;
        const scrollAmount = testimonialsContainer.offsetWidth * currentIndex;
        testimonialsContainer.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }

    function showNext() {
        if (!testimonialsContainer) return;
        const numCards = testimonialsContainer.children.length;
        currentIndex = (currentIndex + 1) % numCards;
        updateCarousel();
    }

    function showPrev() {
        if (!testimonialsContainer) return;
        const numCards = testimonialsContainer.children.length;
        currentIndex = (currentIndex - 1 + numCards) % numCards;
        updateCarousel();
    }

    function startAutoScroll() {
        stopAutoScroll();
        autoScrollInterval = setInterval(showNext, 5000);
    }

    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }

    if (testimonialsContainer && prevTestimonialBtn && nextTestimonialBtn) {
        nextTestimonialBtn.addEventListener('click', () => {
            stopAutoScroll();
            showNext();
            startAutoScroll();
        });

        prevTestimonialBtn.addEventListener('click', () => {
            stopAutoScroll();
            showPrev();
            startAutoScroll();
        });

        testimonialsContainer.addEventListener('mouseenter', stopAutoScroll);
        testimonialsContainer.addEventListener('mouseleave', startAutoScroll);

        let touchStartX = 0;
        testimonialsContainer.addEventListener('touchstart', (e) => {
            stopAutoScroll();
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        testimonialsContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 50) {
                showNext();
            } else if (touchEndX - touchStartX > 50) {
                showPrev();
            }
            startAutoScroll();
        }, { passive: true });

        startAutoScroll();
    }

    // --- Animaciones al Hacer Scroll ---
    const scrollElements = document.querySelectorAll(".animate-on-scroll");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    scrollElements.forEach(el => observer.observe(el));


    // --- Widget de WhatsApp ---
    const whatsappWidget = document.getElementById('whatsapp-chat-widget');
    const whatsappButton = document.getElementById('whatsapp-button');
    const closeChatPreview = document.getElementById('close-chat-preview');
    const typingIndicator = document.getElementById('typing-indicator');
    const messagesContainer = document.querySelector('#chat-preview .overflow-y-auto');
    let typingTimeout;

    const conversations = [
        {
            msg1: "¡Hola! 👋 ¿Tienes alguna pregunta sobre el curso ProgCero?",
            msg2: "Puedo ayudarte con los horarios, el contenido o el proceso de inscripción. ¡Tú dirás!"
        },
        {
            msg1: "¡Hey! Veo que te interesa la programación. ¿Te gustaría saber más sobre nuestro curso?",
            msg2: "Pregúntame lo que quieras, estoy para ayudarte. 😊"
        },
        {
            msg1: "¡Qué bueno verte por aquí! ¿En qué puedo ayudarte hoy?",
            msg2: "Tenemos inscripciones abiertas. ¡No te quedes sin tu cupo!"
        },
        {
            msg1: "¿Necesito saber programar para unirme? ¡Para nada!",
            msg2: "El curso está diseñado para principiantes. ¡Empezamos desde lo más básico!"
        },
        {
            msg1: "¡Hola! ¿Te interesa saber qué proyectos podrás construir?",
            msg2: "Al final del curso, crearás tu propio gestor de tareas o incluso un pequeño juego. 🚀"
        },
        {
            msg1: "¿Qué tal? ¿Tienes dudas sobre la certificación?",
            msg2: "Sí, al completar el curso recibirás un certificado para validar tus nuevas habilidades."
        }
    ];

    function showTypingAndReply() {
        clearTimeout(typingTimeout);

        const firstMessage = document.getElementById('first-message');
        const secondMessage = document.getElementById('second-message');

        if (secondMessage) secondMessage.classList.add('hidden');
        if (firstMessage) firstMessage.classList.add('hidden');

        const randomIndex = Math.floor(Math.random() * conversations.length);
        const selectedConvo = conversations[randomIndex];

        const firstMessageP = firstMessage.querySelector('p');
        const secondMessageP = secondMessage.querySelector('p');
        const firstMessageTime = firstMessage.querySelector('.message-time');
        const secondMessageTime = secondMessage.querySelector('.message-time');

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (firstMessageP) firstMessageP.textContent = selectedConvo.msg1;
        if (secondMessageP) secondMessageP.textContent = selectedConvo.msg2;
        if (firstMessageTime) firstMessageTime.textContent = timeString;
        if (secondMessageTime) secondMessageTime.textContent = timeString;

        setTimeout(() => {
            if (firstMessage) firstMessage.classList.remove('hidden');
            if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 500);

        typingTimeout = setTimeout(() => {
            if (typingIndicator) typingIndicator.classList.remove('hidden');
            if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;

            typingTimeout = setTimeout(() => {
                if (typingIndicator) typingIndicator.classList.add('hidden');
                if (secondMessage) {
                    secondMessage.classList.remove('hidden');
                    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 2500);
        }, 1500);
    }

    function stopTyping() {
        clearTimeout(typingTimeout);
        if (typingIndicator) typingIndicator.classList.add('hidden');
    }

    function openWhatsApp() {
        if (!whatsappWidget) return;
        whatsappWidget.classList.add('open');
        showTypingAndReply();
        speak("Te invitamos a que te inscribas. Dale en el botón Iniciar Chat para comunicarte con nosotros.");
    }

    function closeWhatsApp() {
        if (!whatsappWidget) return;
        whatsappWidget.classList.remove('open');
        stopTyping();
    }

    if (whatsappButton) {
        whatsappButton.addEventListener('click', (e) => {
            e.stopPropagation();
            whatsappWidget.classList.contains('open') ? closeWhatsApp() : openWhatsApp();
        });
    }

    if (closeChatPreview) {
        closeChatPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            closeWhatsApp();
        });
    }

    document.addEventListener('click', (e) => {
        if (whatsappWidget && whatsappWidget.classList.contains('open') && !whatsappWidget.contains(e.target)) {
            closeWhatsApp();
        }
    });

    // =========================================================================
    // MÓDULO DE ACCESIBILIDAD (TEXT-TO-SPEECH)
    // =========================================================================
    const synth = window.speechSynthesis;
    let isMuted = false;
    const voiceSettingsToggle = document.getElementById('voice-settings-toggle');
    const voiceSettingsPanel = document.getElementById('voice-settings-panel');
    const volumeSlider = document.getElementById('volume-slider');
    const rateSlider = document.getElementById('rate-slider');
    const pauseResumeButton = document.getElementById('pause-resume-button');
    const muteToggleButton = document.getElementById('mute-toggle-button');
    let preferredVoice; // Cambiamos el nombre de la variable para que sea más genérico
    const welcomeModal = document.getElementById('welcome-modal-overlay');
    const startExperienceButton = document.getElementById('start-experience-button');

    // ** MEJORA: Lógica de selección de voz más robusta **
    function loadVoices() {
        const voices = synth.getVoices();
        // 1. Prioridad: Voces en español de España ('es-ES').
        preferredVoice = voices.find(voice => voice.lang === 'es-ES');

        // 2. Si no hay, busca cualquier voz en español ('es-').
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang.startsWith('es-'));
        }
        
        // 3. Si no encuentra ninguna, 'preferredVoice' quedará como 'undefined' 
        // y el navegador usará su voz por defecto para el idioma 'es-ES'.
    }

    // El evento 'onvoiceschanged' se dispara cuando la lista de voces está lista.
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
    loadVoices(); // Llama una vez por si las voces ya están cargadas.


    function speak(text) {
        if (isMuted || !text) return;
        // Si ya está hablando, lo cancela para empezar el nuevo texto
        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Asigna la voz preferida si se encontró una
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        utterance.lang = 'es-ES'; // Especifica el idioma deseado
        utterance.rate = parseFloat(rateSlider.value);
        utterance.pitch = 0.9;
        utterance.volume = parseFloat(volumeSlider.value);

        // Controla la animación del botón de voz
        utterance.onstart = () => {
            // Activa la animación
            if (voiceSettingsToggle) voiceSettingsToggle.classList.add('is-speaking');

            // Resetea el estado del botón de pausa
            if (pauseResumeButton) {
                const icon = pauseResumeButton.querySelector('i');
                const text = pauseResumeButton.querySelector('span');
                icon.className = 'fas fa-pause';
                text.textContent = 'Pausar';
            }
        };

        utterance.onend = () => {
            // Desactiva la animación cuando termina de hablar
            if (voiceSettingsToggle) voiceSettingsToggle.classList.remove('is-speaking');
        };

        synth.speak(utterance);
    }

    // Lógica para el botón de Pausar/Reanudar
    if (pauseResumeButton) {
        pauseResumeButton.addEventListener('click', () => {
            if (synth.speaking && !synth.paused) {
                synth.pause();
                const icon = pauseResumeButton.querySelector('i');
                const text = pauseResumeButton.querySelector('span');
                icon.className = 'fas fa-play';
                text.textContent = 'Reanudar';
            } else if (synth.paused) {
                synth.resume();
                const icon = pauseResumeButton.querySelector('i');
                const text = pauseResumeButton.querySelector('span');
                icon.className = 'fas fa-pause';
                text.textContent = 'Pausar';
            }
        });
    }

    // Lógica para el botón de Silenciar/Activar
    if (muteToggleButton) {
        muteToggleButton.addEventListener('click', () => {
            isMuted = !isMuted;
            synth.cancel(); // Detiene y resetea cualquier locución en curso

            const icon = muteToggleButton.querySelector('i');
            const text = muteToggleButton.querySelector('span');
            icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            text.textContent = isMuted ? 'Activar' : 'Silenciar';

            // Resetea el botón de pausa si se silencia
            if (isMuted && pauseResumeButton) {
                const pauseIcon = pauseResumeButton.querySelector('i');
                const pauseText = pauseResumeButton.querySelector('span');
                pauseIcon.className = 'fas fa-pause';
                pauseText.textContent = 'Pausar';
            }
        });
    }


    if (voiceSettingsToggle) {
        voiceSettingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (voiceSettingsPanel) voiceSettingsPanel.classList.toggle('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (voiceSettingsPanel && voiceSettingsPanel.classList.contains('open') && !voiceSettingsPanel.contains(e.target) && e.target !== voiceSettingsToggle) {
            voiceSettingsPanel.classList.remove('open');
        }
    });


    if (welcomeModal) welcomeModal.classList.add('visible');

    if (startExperienceButton) {
        startExperienceButton.addEventListener('click', () => {
            if (welcomeModal) welcomeModal.classList.remove('visible');
            speak("¡Hola, futuro colega! Te doy la bienvenida a ProgCero, la plataforma donde tu viaje para convertirte en un gran programador comienza ahora. Disfruta toda la información y te esperamos dentro de nuestro curso.");
        });
    }

    document.querySelectorAll('.speech-button').forEach(button => {
        button.addEventListener('click', () => {
            const textToSpeak = button.dataset.speech;
            speak(textToSpeak);
        });
    });

    // =========================================================================
    // MÓDULO DE SIMULACIÓN DE CÓDIGO
    // =========================================================================
    class CodeTyper {
        constructor(codeEl, outputEl, codeContent, options = {}) {
            this.codeEl = codeEl;
            this.outputEl = outputEl;
            this.codeContent = codeContent;
            this.typeSpeed = options.typeSpeed || 25;
            this.lineDelay = options.lineDelay || 200;
            this.startDelay = options.startDelay || 500;
            this.cursor = document.createElement('span');
            this.cursor.className = 'typing-cursor border-r-2 border-white';
            this.isRunning = false;
        }

        async start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.codeEl.innerHTML = '';
            this.outputEl.innerHTML = '';
            this.outputEl.classList.add('hidden');

            await this.sleep(this.startDelay);

            for (const content of this.codeContent) {
                const lineEl = document.createElement('div');
                this.codeEl.appendChild(lineEl);

                await this.typeRawText(content.raw, lineEl);
                lineEl.innerHTML = content.html;
                await this.sleep(this.lineDelay);
            }

            await this.sleep(1000);
            await this.showOutput();
            this.isRunning = false;
        }

        typeRawText(text, element) {
            return new Promise(resolve => {
                let i = 0;
                element.appendChild(this.cursor);
                const interval = setInterval(() => {
                    if (i < text.length) {
                        const textNode = document.createTextNode(text[i]);
                        element.insertBefore(textNode, this.cursor);
                        i++;
                    } else {
                        element.removeChild(this.cursor);
                        clearInterval(interval);
                        resolve();
                    }
                }, this.typeSpeed);
            });
        }

        async showOutput() {
            this.outputEl.classList.remove('hidden');
            this.outputEl.innerHTML = `
                <div id="task-list-output">
                    <h3 class="text-lg font-bold text-primary mb-2">Mi Lista de Tareas</h3>
                </div>
            `;
            const taskList = this.outputEl.querySelector('#task-list-output');

            const tasks = [
                "Aprender conceptos básicos de Python",
                "Practicar con ejercicios de lógica",
                "Desarrollar el proyecto final del curso"
            ];

            for (let i = 0; i < tasks.length; i++) {
                await this.sleep(700);
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.style.animationDelay = `${i * 0.1}s`;
                taskItem.innerHTML = `
                    <div class="task-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <span class="task-text">${tasks[i]}</span>
                `;
                taskList.appendChild(taskItem);
            }

            await this.sleep(1500);
            const taskItems = taskList.querySelectorAll('.task-item');
            for (let i = 0; i < taskItems.length; i++) {
                await this.sleep(1000);
                taskItems[i].classList.add('completed');
            }
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    const codeEditor = document.getElementById('code-editor');
    const codeOutput = document.getElementById('code-output');
    const codeSimulationContainer = document.getElementById('code-simulation-container');

    if (codeEditor && codeOutput && codeSimulationContainer) {
        const codeContent = [
            { raw: '# Lógica: Python | Diseño: HTML/CSS', html: '<span class="code-comment"># Lógica: Python | Diseño: HTML/CSS</span>' },
            { raw: 'class Task:', html: '<span class="code-keyword">class</span> <span class="code-function">Task</span><span class="code-punctuation">:</span>' },
            { raw: '    def __init__(self, name):', html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">def</span> <span class="code-function">__init__</span><span class="code-punctuation">(</span>self, name<span class="code-punctuation">):</span>' },
            { raw: '        self.name = name', html: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.name = name' },
            { raw: '        self.done = False', html: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.done = <span class="code-keyword">False</span>' },
            { raw: '', html: '&nbsp;' },
            { raw: 'class TaskManager:', html: '<span class="code-keyword">class</span> <span class="code-function">TaskManager</span><span class="code-punctuation">:</span>' },
            { raw: '    def __init__(self):', html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">def</span> <span class="code-function">__init__</span><span class="code-punctuation">(</span>self<span class="code-punctuation">):</span>' },
            { raw: '        self.tasks = []', html: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.tasks = []' },
            { raw: '', html: '&nbsp;' },
            { raw: '    def add(self, task_name):', html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">def</span> <span class="code-function">add</span><span class="code-punctuation">(</span>self, task_name<span class="code-punctuation">):</span>' },
            { raw: '        self.tasks.append(Task(task_name))', html: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.tasks.append(<span class="code-function">Task</span>(task_name))' },
            { raw: '', html: '&nbsp;' },
            { raw: '    def complete(self, index):', html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">def</span> <span class="code-function">complete</span><span class="code-punctuation">(</span>self, index<span class="code-punctuation">):</span>' },
            { raw: '        self.tasks[index].done = True', html: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.tasks[index].done = <span class="code-keyword">True</span>' },
        ];

        const codeTyper = new CodeTyper(codeEditor, codeOutput, codeContent);

        const codeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !codeTyper.isRunning) {
                    codeTyper.start();
                }
            });
        }, { threshold: 0.6 });

        codeObserver.observe(codeSimulationContainer);
    }
});
