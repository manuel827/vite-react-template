(() => {
	const buttons = document.querySelectorAll("[data-onesignal-opt-in]");
	if (!buttons.length) return;

	const deferred = window.OneSignalDeferred;
	const statusFor = (button) => button.parentElement?.querySelector("[data-onesignal-status]");
	let oneSignal;
	const readyTimeout = window.setTimeout(() => {
		if (oneSignal) return;
		for (const button of buttons) {
			button.disabled = true;
			button.textContent = "Notificações indisponíveis";
			const status = statusFor(button);
			if (status) status.textContent = "Não foi possível carregar o serviço de notificações. Atualize a página e tente novamente.";
		}
	}, 15000);

	if (!deferred) {
		window.clearTimeout(readyTimeout);
		for (const button of buttons) {
			button.textContent = "Notificações indisponíveis";
			const status = statusFor(button);
			if (status) status.textContent = "O serviço de notificações não foi inicializado.";
		}
		return;
	}

	deferred.push((instance) => {
		oneSignal = instance;
		window.clearTimeout(readyTimeout);
		for (const button of buttons) {
			button.disabled = false;
			button.textContent = "Ativar notificações";
		}
	});

	document.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest("[data-onesignal-opt-in]");
		if (!(button instanceof HTMLButtonElement)) return;

		const status = statusFor(button);
		if (!oneSignal) {
			if (status) status.textContent = "O serviço de notificações ainda não está pronto. Atualize a página e tente novamente.";
			return;
		}
		if (!window.isSecureContext || !("Notification" in window)) {
			if (status) status.textContent = "As notificações exigem uma ligação segura e um navegador compatível.";
			return;
		}
		if (Notification.permission === "denied") {
			if (status) status.textContent = "As notificações estão bloqueadas no navegador. Altere a permissão nas definições do site.";
			return;
		}

		button.disabled = true;
		button.textContent = "A abrir pedido...";
		if (status) status.textContent = "";
		void (async () => {
			try {
				await oneSignal.Slidedown.promptPush();
				if (status) status.textContent = "Escolha Permitir no pedido do navegador para receber notificações.";
			} catch (error) {
				console.error("Unable to open the OneSignal push prompt:", error);
				if (status) status.textContent = "Não foi possível abrir o pedido de notificações. Atualize a página e tente novamente.";
			} finally {
				button.disabled = false;
				button.textContent = "Ativar notificações";
			}
		})();
	});
})();
