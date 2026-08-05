const SerialGen = {

  config: {
    prefix: 'HD',
    randomLength: 8,
    seqLength: 3,
    separator: '-'
  },

  generate(options = {}) {
    const cfg = { ...this.config, ...options };
    const random = this.randomDigits(cfg.randomLength);
    const seq    = this.dailySequence(cfg.seqLength);
    return `${cfg.prefix}${cfg.separator}${random}${cfg.separator}${seq}`;
  },

  randomDigits(length) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  },

  dailySequence(length) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const secondsToday = Math.floor((now.getTime() - startOfDay) / 1000);
    const seq = (secondsToday % 900) + 100;
    return String(seq).padStart(length, '0');
  }

};
