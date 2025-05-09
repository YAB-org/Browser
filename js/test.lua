get('search').on_click(function()
    local extra = '';
    if window ~= nil then
        if window.browser == 'bussinga' then
            extra = '&html=true'
        end
    end
    local res = fetch({
        url = "https://api.fsh.plus/wikipedia?page=" .. get('query').get_contents() .. extra,
        method = "GET",
        headers = { ["Content-Type"] = "application/json" },
        body = ''
    })

    get('title').set_contents(res.title)
    get('text').set_contents(res.data)
end)A37742