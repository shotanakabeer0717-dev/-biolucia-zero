(function () {
  // ▼ 遷移先（0円LP または 直BOT）。確定したら差し替える
  var CTA_URL = 'https://biolucia.jp/shopping/lp.php?p=XXXXX';

  var TOTAL = 5;
  var answers = {};
  var questions = document.querySelectorAll('.q');
  var bar = document.getElementById('progressBar');
  var label = document.getElementById('progressLabel');
  var loading = document.getElementById('loading');
  var result = document.getElementById('result');
  var cta = document.getElementById('ctaBtn');
  var finished = false;

  // 広告パラメータ（gclid / utm 等）を遷移先へ引き継ぐ
  function buildCtaUrl() {
    var url = new URL(CTA_URL, location.href);
    new URLSearchParams(location.search).forEach(function (v, k) { url.searchParams.set(k, v); });
    return url.toString();
  }
  cta.href = buildCtaUrl();

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }

  function setProgress(step) {
    bar.style.width = (Math.min(step, TOTAL) / TOTAL * 100) + '%';
    label.textContent = step > TOTAL ? '回答完了' : 'Q' + step + ' / ' + TOTAL;
  }

  function scrollToEl(el) {
    var top = el.getBoundingClientRect().top + window.pageYOffset - 16;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function reveal(el) {
    el.hidden = false;
    el.classList.add('is-enter');
    setTimeout(function () { scrollToEl(el); }, 80);
  }

  questions.forEach(function (q) {
    var n = Number(q.dataset.q);
    q.querySelectorAll('.opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var first = !(n in answers);
        q.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        answers[n] = btn.dataset.value;
        track('survey_answer', { question: 'Q' + n, answer: btn.dataset.value });

        if (!first) return; // 回答し直しは選択の変更のみ
        q.classList.add('is-done');

        setTimeout(function () {
          if (n < TOTAL) {
            setProgress(n + 1);
            reveal(questions[n]);
          } else if (!finished) {
            finished = true;
            setProgress(TOTAL + 1);
            loading.hidden = false;
            scrollToEl(loading);
            setTimeout(function () {
              loading.hidden = true;
              reveal(result);
              track('survey_complete', { answers: answers });
            }, 1200);
          }
        }, 350);
      });
    });
  });

  cta.addEventListener('click', function () { track('cta_click', { answers: answers }); });

  setProgress(1);
})();
