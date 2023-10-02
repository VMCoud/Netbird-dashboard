

export const formatOS = (os) => {
    if (os.startsWith("windows 10")) {
        return "Windows 10";
    }

    if (os.startsWith("Darwin")) {
        return os.replace("Darwin", "MacOS");
    }
    // capitalize first letter
    os = os.charAt(0).toUpperCase() + os.slice(1);
    return os;
};

export const formatDate = date => {
    if (new Date(date).getTime() > new Date("2099-12-31").getTime()) {
        return new Date(date).toLocaleDateString("zh-CN", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(date).toLocaleDateString("zh-CN", { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric' });
}

export const capitalize = text => {
    if (!text) {
        return text
    }
    return text.charAt(0).toUpperCase() + text.slice(1)
}

export const checkExpiresIn = (_, value) => {
    if (value.number > 0) {
        return Promise.resolve();
    }
    return Promise.reject(new Error("Expiration must be greater than zero"));
};

export const formatDateTime = date => {
    if (new Date(date).getTime() > new Date("2099-12-31").getTime()) {
        return new Date(date).toLocaleDateString("zh-CN", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    }
    return new Date(date).toLocaleDateString("zh-CN", { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
}

export const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

const MONTH_NAMES = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
];


function getFormattedDate(date, preformattedDate = false, hideYear = false) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    let minutes = date.getMinutes();

    if (minutes < 10) {
        // Adding leading zero to minutes
        minutes = `0${minutes}`;
    }

    if (preformattedDate) {
        // Today
        // Yesterday
        return `${preformattedDate}`;
    }

    if (hideYear) {
        // 10. January
        return `${day}. ${month}`;
    }

    // 10. January 2017.
    return `${day}. ${month} ${year}`;
}

export const fullDate = (dateParam) => {
    if (!dateParam) {
        return null;
    }

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
    return getFormattedDate(date);
}

export const timeAgo = (dateParam) => {
    if (!dateParam) {
        return null;
    }

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
    const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
    const today = new Date();
    const yesterday = new Date(today - DAY_IN_MS);
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const isToday = today.toDateString() === date.toDateString();
    const isYesterday = yesterday.toDateString() === date.toDateString();
    const isThisYear = today.getFullYear() === date.getFullYear();
    const never = date.getFullYear() === 1;

    if (seconds < -1) {
        return getFormattedDate(date, false, true);
    } else if (seconds < 5) {
        return '刚刚';
    } else if (seconds < 60) {
        return `${seconds} 秒前`;
    } else if (seconds < 90) {
        return '大约 1 分钟前';
    } else if (minutes < 60) {
        return `${minutes} 分钟前`;
    } else if (isToday) {
        return getFormattedDate(date, '今天'); // 今天 10:20
    } else if (isYesterday) {
        return getFormattedDate(date, '昨天'); // 昨天 10:20
    } else if (isThisYear) {
        return getFormattedDate(date, false, true); // 1 月 10 日 10:20
    } else if (never) {
        return '从不';
    }

    return getFormattedDate(date); // 2017 年 1 月 10 日 10:20
}

export const copyToClipboard = (copyText) => {
    navigator.clipboard.writeText(copyText);
}

export const isNetBirdHosted = () => {
    return window.location.hostname.endsWith(".netbird.io") || window.location.hostname.endsWith(".wiretrustee.com")
}

export const isLocalDev = () => {
    return window.location.hostname.includes("localhost")
}

const domainRegex =
    /^(?!.*\s)[a-zA-Z0-9](?!.*\s$)(?!.*\.$)(?:(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.){1,126}(?!-)[a-zA-Z0-9-]{1,63}(?<!-)$/;

export const domainValidator = (_, domain) => {
    if (domainRegex.test(domain)) {
        return Promise.resolve();
    }
    // setIsPrimary(false);
    return Promise.reject(
        new Error(
            "请输入一个有效的域名，例如 example.com 或 intra.example.com"
        )
    );
};