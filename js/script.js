// Variáveis para armazenar os dados carregados
        let storeData, productData, marketingData;

        // Elementos do DOM
        const varejoGrid = document.getElementById('varejo-grid');
        const escritorioGrid = document.getElementById('escritorio-grid');
        const modal = document.getElementById('store-modal');
        const modalContent = document.getElementById('modal-content');

        // Função para carregar os dados dos arquivos JSON
        async function loadData() {
            try {
                const [storesRes, productsRes, marketingRes] = await Promise.all([
                    fetch('../dados/lojas.json'),
                    fetch('../dados/produtos.json'),
                    fetch('../dados/marketing.json')
                ]);

                storeData = await storesRes.json();
                productData = await productsRes.json();
                marketingData = await marketingRes.json();

                initializeApp();
            } catch (error) {
                console.error("Erro ao carregar os dados:", error);
                varejoGrid.innerHTML = `<p class="text-red-500 col-span-full text-center">Falha ao carregar os dados das lojas. Por favor, verifique se os arquivos JSON estão na pasta raiz e tente recarregar a página.</p>`;
            }
        }

        // Função para inicializar a aplicação após o carregamento dos dados
        function initializeApp() {
            storeData.forEach(store => {
                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300';
                card.innerHTML = `<h2 class="text-xl font-bold text-gray-900 dark:text-white truncate">${store.nome_loja}</h2><p class="text-indigo-500 dark:text-indigo-400">${store.tipo_negocio}</p><div class="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"><span>Lucro:</span><div class="flex">${createStars(store.avaliacao.lucro)}</div></div>`;
                card.addEventListener('click', () => openModal(store));

                if (store.tipo_negocio === 'Varejo') {
                    varejoGrid.appendChild(card);
                } else if (store.tipo_negocio === 'Escritório') {
                    escritorioGrid.appendChild(card);
                }
            });
        }

        // Funções auxiliares de criação de HTML
        const createStars = (rating) => Array.from({ length: 5 }, (_, i) => `<svg class="w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`).join('');
        const toSafeId = (name) => name.replace(/[^a-zA-Z0-9]/g, '');

        const createList = (items, title, containerId) => {
            if (!items || items.length === 0) return '';
            return `
                <div class="mt-4">
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-gray-100">${title}</h3>
                    <ul id="${containerId}" class="mt-2 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md">
                        ${items.map((item, index) => `
                            <li class="flex justify-between items-center p-3 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'} border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <span>${item}</span>
                                <span id="price-${toSafeId(item)}" class="font-bold text-indigo-600 dark:text-indigo-400 text-right ml-4" style="min-width: 70px;"></span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        };

        const parseTimeRange = (timeStr) => {
            if (!timeStr || timeStr === 'Fechado') return { start: -1, end: -1 };
            if (timeStr === 'Aberto 24h') return { start: 0, end: 25 };
            const parts = timeStr.split(' - ');
            const [startHour] = parts[0].split(':').map(Number);
            let [endHour] = parts[1].split(':').map(Number);
            if (endHour === 0) endHour = 24;
            return { start: startHour, end: endHour, crossesMidnight: endHour < startHour };
        };

        const createHoursTable = (schedule) => {
            let tableHeader = '<tr><th class="py-2 px-1 border border-gray-300 dark:border-gray-600">Dia</th>' + Array.from({ length: 24 }, (_, i) => `<th class="py-2 px-1 border border-gray-300 dark:border-gray-600">${i}</th>`).join('') + '</tr>';
            let tableBody = Object.entries(schedule).map(([day, time]) => {
                let row = `<tr><td class="py-2 px-2 border border-gray-300 dark:border-gray-600 font-medium capitalize text-left">${day.replace('_', '-')}</td>`;
                const { start, end, crossesMidnight } = parseTimeRange(time);
                for (let h = 0; h < 24; h++) {
                    let isOpen = start !== -1 && (crossesMidnight ? (h >= start || h < end) : (h >= start && h < end));
                    row += `<td class="py-2 px-1 border border-gray-300 dark:border-gray-600"><div class="w-2.5 h-2.5 ${isOpen ? 'bg-green-500' : 'bg-red-500'} rounded-full mx-auto"></div></td>`;
                }
                return row + '</tr>';
            }).join('');
            return `<div class="mt-6 overflow-x-auto"><h3 class="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Horário de Funcionamento</h3><table class="w-full text-sm text-center border-collapse"><thead class="bg-gray-50 dark:bg-gray-700">${tableHeader}</thead><tbody>${tableBody}</tbody></table></div>`;
        };

        const openModal = (store) => {
            let currentSort = 'name-asc';
            let currentBairro = "Garment District";

            const bairros = ["Garment District", "Hells Kitchen", "Murray Hill", "Midtown", "Lower Manhattan"];
            const storeTypeKey = store.tipo_negocio.toLowerCase() === 'escritório' ? 'escritorio' : 'varejo';
            let capacityButtonsHTML = '';
            marketingData.marketing.niveis.forEach(level => {
                const capacity = level.capacidade_clientes[storeTypeKey];
                if (capacity !== null && capacity !== undefined) {
                    capacityButtonsHTML += `<button class="capacity-btn px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-indigo-500 hover:text-white rounded-md transition" data-level="${level.nivel}">${store.tipo_negocio}: ${capacity}</button>`;
                }
            });

            modalContent.innerHTML = `
                <div class="p-6 md:p-8">
                    <div class="flex justify-between items-start">
                        <div><h2 class="text-3xl font-bold text-gray-900 dark:text-white">${store.nome_loja}</h2><p class="text-md text-indigo-600 dark:text-indigo-400 font-semibold">${store.tipo_negocio}</p></div>
                        <button id="close-modal" class="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Informações Gerais</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1"><h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">Avaliações & Equipe</h4><div class="space-y-2 text-gray-600 dark:text-gray-300"><div class="flex justify-between items-center"><span>Preço do Layout:</span> <div class="flex">${createStars(store.avaliacao.preco_layout)}</div></div><div class="flex justify-between items-center"><span>Lucro:</span> <div class="flex">${createStars(store.avaliacao.lucro)}</div></div><div class="flex justify-between items-center"><span>Segurança:</span> <div class="flex">${createStars(store.seguranca)}</div></div><div class="flex justify-between items-center mt-2"><span>Funcionários:</span><span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">${store.funcionarios}</span></div></div></div>
                        <div class="md:col-span-2"><h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">Marketing por Capacidade</h4><div id="capacity-container" class="flex flex-wrap gap-2">${capacityButtonsHTML}</div><div id="marketing-details" class="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-h-[100px]"></div></div>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-lg text-gray-800 dark:text-gray-100">Preços e Produtos</h3>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-gray-500 dark:text-gray-400">Ordenar por:</span>
                            <button id="sort-name-btn" class="sort-btn px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-indigo-500 hover:text-white transition">Nome <span id="sort-name-icon"></span></button>
                            <button id="sort-price-btn" class="sort-btn px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-indigo-500 hover:text-white transition">Preço <span id="sort-price-icon"></span></button>
                        </div>
                    </div>
                    <div id="bairros-container" class="flex flex-wrap gap-2 mt-2">${bairros.map(b => `<button class="bairro-btn px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-indigo-500 hover:text-white rounded-md transition" data-bairro="${b}">${b}</button>`).join('')}</div>
                    <div id="product-lists" class="grid grid-cols-1 md:grid-cols-2 gap-x-8"></div>
                    ${createHoursTable(store.horario_funcionamento)}
                </div>
            `;

            const productListsContainer = modalContent.querySelector('#product-lists');

            const updateLists = () => {
                const [sortKey, sortOrder] = currentSort.split('-');

                const sortFunction = (a, b) => {
                    if (sortKey === 'name') {
                        return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
                    }
                    if (sortKey === 'price') {
                        const productA = productData.find(p => p.nome.trim() === a.trim());
                        const productB = productData.find(p => p.nome.trim() === b.trim());
                        const priceA = productA ? productA.bairros[currentBairro] : -1;
                        const priceB = productB ? productB.bairros[currentBairro] : -1;
                        if (priceA === -1) return 1;
                        if (priceB === -1) return -1;
                        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
                    }
                    return 0;
                };

                const sortedProdutosPrimarios = [...store.produtos_primarios].sort(sortFunction);
                const sortedOutrosProdutos = [...store.outros_produtos].sort(sortFunction);
                const sortedServicos = [...store.servicos].sort(sortFunction);

                productListsContainer.innerHTML = `
                    <div>${createList(sortedProdutosPrimarios, 'Produtos Primários', 'produtos-primarios-list')}</div>
                    <div>${createList(sortedOutrosProdutos, 'Outros Produtos', 'outros-produtos-list')}</div>
                    <div class="md:col-span-2">${createList(sortedServicos, 'Serviços', 'servicos-list')}</div>
                `;
                updatePrices(currentBairro, [...store.produtos_primarios, ...store.outros_produtos, ...store.servicos]);
            };

            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.add('opacity-100'); modalContent.classList.remove('scale-95'); }, 10);

            document.getElementById('close-modal').addEventListener('click', closeModal);

            document.querySelectorAll('.bairro-btn').forEach(button => button.addEventListener('click', (e) => {
                currentBairro = e.target.dataset.bairro;
                document.querySelectorAll('.bairro-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                updateLists();
            }));

            document.querySelectorAll('.capacity-btn').forEach(button => button.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                displayMarketingInfo(level);
                document.querySelectorAll('.capacity-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }));

            const sortNameBtn = document.getElementById('sort-name-btn');
            const sortPriceBtn = document.getElementById('sort-price-btn');
            const sortNameIcon = document.getElementById('sort-name-icon');
            const sortPriceIcon = document.getElementById('sort-price-icon');

            const updateSortButtons = () => {
                const [key, order] = currentSort.split('-');
                sortNameBtn.classList.toggle('active', key === 'name');
                sortPriceBtn.classList.toggle('active', key === 'price');
                sortNameIcon.textContent = key === 'name' ? (order === 'asc' ? '▲' : '▼') : '';
                sortPriceIcon.textContent = key === 'price' ? (order === 'asc' ? '▲' : '▼') : '';
            };

            sortNameBtn.addEventListener('click', () => {
                const [key, order] = currentSort.split('-');
                currentSort = key === 'name' && order === 'asc' ? 'name-desc' : 'name-asc';
                updateLists();
                updateSortButtons();
            });

            sortPriceBtn.addEventListener('click', () => {
                const [key, order] = currentSort.split('-');
                currentSort = key === 'price' && order === 'asc' ? 'price-desc' : 'price-asc';
                updateLists();
                updateSortButtons();
            });

            // Estado inicial
            updateLists();
            updateSortButtons();
            document.querySelector('.bairro-btn').classList.add('active');
            displayMarketingInfo(null);
        };

        const displayMarketingInfo = (level) => {
            const detailsContainer = document.getElementById('marketing-details');
            const levelData = marketingData.marketing.niveis.find(l => l.nivel == level);
            if (!levelData) {
                detailsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Selecione uma capacidade para ver os detalhes de marketing.</p>';
                return;
            }

            const createCampaignRow = (campaigns, type) => {
                const filtered = Object.entries(campaigns).filter(([name]) => name.includes(type));
                if (filtered.length === 0) return '';

                return `<div class="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <span class="font-medium text-sm text-gray-700 dark:text-gray-300 w-16">${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                    ${filtered.map(([campaign, isAvailable]) => {
                    let displayName = campaign.replace(/_/g, ' ').replace(type, '').replace('campanha', '').trim();
                    displayName = displayName.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                    return `
                            <div class="flex items-center text-sm ${isAvailable ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}">
                                <span class="w-3 h-3 mr-1.5 inline-block rounded-full border ${isAvailable ? 'bg-green-500 border-green-600' : 'bg-gray-300 dark:bg-gray-500 border-gray-400'}"></span>
                                <span>${displayName}</span>
                            </div>
                        `;
                }).join('')}
                </div>`;
            };

            const internetCampaignsHTML = createCampaignRow(levelData.campanhas_disponiveis, 'internet');
            const outdoorCampaignsHTML = createCampaignRow(levelData.campanhas_disponiveis, 'outdoor');

            detailsContainer.innerHTML = `
                <div>
                    <div class="flex space-x-8 mb-3">
                        <div>
                            <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-400">Preço da Campanha</h4>
                            <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">$${levelData.preco.toLocaleString()}</p>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-400">Eficácia</h4>
                            <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${levelData.eficacia_marketing_percentual}%</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Campanhas Disponíveis</h4>
                        <div class="space-y-2">
                            ${internetCampaignsHTML}
                            ${outdoorCampaignsHTML}
                        </div>
                    </div>
                </div>
            `;
        };

        const updatePrices = (bairro, storeProducts) => {
            storeProducts.forEach(productName => {
                const productInfo = productData.find(p => p.nome.trim() === productName.trim());
                const priceSpan = document.getElementById(`price-${toSafeId(productName)}`);
                if (productInfo && priceSpan) {
                    const price = productInfo.bairros[bairro];
                    priceSpan.textContent = price ? `$${price.toFixed(2)}` : '-';
                }
            });
        };

        const closeModal = () => {
            modal.classList.remove('opacity-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        // Inicia o carregamento dos dados quando o DOM estiver pronto
        document.addEventListener('DOMContentLoaded', loadData);

        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });