const homeController = {
    getHome : (req, res)=>{
        res.render("index");
    }
}

module.exports = homeController;